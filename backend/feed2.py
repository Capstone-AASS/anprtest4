# feed2.py

import asyncio
import json
import sys
import logging
import websockets
from aiortc import RTCPeerConnection, VideoStreamTrack, RTCSessionDescription, RTCIceCandidate
from av import VideoFrame
import cv2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("feed2")

class VideoTrackCustom(VideoStreamTrack):
    """
    A VideoStreamTrack that captures frames from a webcam using OpenCV.
    """
    def __init__(self):
        super().__init__()  # Initialize the base class
        self.cap = cv2.VideoCapture(0)

        if not self.cap.isOpened():
            raise Exception("Cannot open camera")

    async def recv(self):
        pts, time_base = await self.next_timestamp()
        ret, frame = self.cap.read()
        if not ret:
            self.cap.release()
            raise Exception("Failed to read frame from camera")

        # Convert the frame to RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Create a VideoFrame
        video_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        video_frame.pts = pts
        video_frame.time_base = time_base

        return video_frame

async def run(feed_id, signaling_url):
    pc = RTCPeerConnection()

    # Event handler for ICE candidates generated by aiortc
    @pc.on("icecandidate")
    async def on_icecandidate(candidate):
        if candidate:
            candidate_message = {
                "type": "candidate",
                "candidate": {
                    "sdpMid": candidate.sdpMid,
                    "sdpMLineIndex": candidate.sdpMLineIndex,
                    "candidate": candidate.candidate,
                },
                "feedId": feed_id
            }
            await websocket.send(json.dumps(candidate_message))
            logger.info(f"Sent ICE candidate: {candidate.candidate}")

    # Event handler for connection state changes
    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        logger.info(f"ICE connection state changed to {pc.iceConnectionState}")
        if pc.iceConnectionState == "failed":
            await pc.close()

    # Event handler for new tracks (not needed for producer)
    @pc.on("track")
    def on_track(track):
        logger.info(f"Track {track.kind} received, but no action is taken as this is a producer.")

    # Connect to the signaling WebSocket
    uri = f"{signaling_url}?feedId={feed_id}"
    async with websockets.connect(uri) as websocket:
        logger.info(f"Connected to signaling server at {uri}")

        # Add video track to the RTCPeerConnection
        video = VideoTrackCustom()
        pc.addTrack(video)
        logger.info("Added video track to RTCPeerConnection")

        # Create and send offer
        offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        logger.info("Created and set local offer")

        # Send 'offer' message to backend
        offer_message = {
            "type": "offer",
            "sdp": pc.localDescription.sdp,
            "type_desc": pc.localDescription.type,
            "feedId": feed_id,
        }
        await websocket.send(json.dumps(offer_message))
        logger.info(f"Sent offer for feedId: {feed_id}")

        # Handle incoming messages from the backend
        async def handle_messages():
            try:
                async for message in websocket:
                    data = json.loads(message)
                    logger.info(f"Received message: {data}")

                    if data["type"] == "answer":
                        # Handle answer from backend
                        answer = RTCSessionDescription(sdp=data["sdp"], type=data["type_desc"])
                        await pc.setRemoteDescription(answer)
                        logger.info("Set remote description with answer SDP")

                    elif data["type"] == "producerTransportCreated":
                        transport_params = data["data"]
                        logger.info("Received producerTransportCreated with transport parameters")

                        # Add ICE candidates received from transport_params
                        for candidate in transport_params.get('iceCandidates', []):
                            rtc_candidate = RTCIceCandidate(
                                sdpMid=candidate["sdpMid"],
                                sdpMLineIndex=candidate["sdpMLineIndex"],
                                candidate=candidate["candidate"]
                            )
                            await pc.addIceCandidate(rtc_candidate)
                            logger.info(f"Added ICE candidate from transport_params: {rtc_candidate.candidate}")

                        # Wait for the transport to be connected before producing
                        @pc.on("connectionstatechange")
                        async def on_connectionstatechange():
                            state = pc.connectionState
                            logger.info(f"RTCPeerConnection state changed to {state}")
                            if state == "connected":
                                # Create and send 'produce' message with rtpParameters
                                producer = next((t for t in pc.getTransceivers() if t.direction == "sendonly"), None)
                                if producer:
                                    rtp_parameters = producer.sender.getParameters()
                                    produce_message = {
                                        "type": "produce",
                                        "rtpParameters": rtp_parameters,
                                        "feedId": feed_id,
                                    }
                                    await websocket.send(json.dumps(produce_message))
                                    logger.info(f"Sent produce message for feedId: {feed_id}")
                            
                    elif data["type"] == "candidate":
                        # Handle incoming ICE candidates from backend
                        candidate_data = data["candidate"]
                        rtc_candidate = RTCIceCandidate(
                            sdpMid=candidate_data["sdpMid"],
                            sdpMLineIndex=candidate_data["sdpMLineIndex"],
                            candidate=candidate_data["candidate"]
                        )
                        await pc.addIceCandidate(rtc_candidate)
                        logger.info(f"Added ICE candidate from backend: {rtc_candidate.candidate}")

                    elif data["type"] == "bye":
                        # Handle termination signal
                        logger.info("Received BYE signal. Closing connection.")
                        break

                    elif data["type"] == "error":
                        # Handle error messages
                        logger.error(f"Error from backend: {data['message']}")

                    else:
                        logger.warning(f"Unhandled message type: {data['type']}")

            except websockets.ConnectionClosed:
                logger.info("WebSocket connection closed")

        # Run the message handler concurrently
        handle_task = asyncio.ensure_future(handle_messages())

        # Keep the script running while handling messages
        await handle_task

        # Close the RTCPeerConnection when done
        await pc.close()
        logger.info("Closed RTCPeerConnection")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python feed2.py <feedId> <signaling_url>", file=sys.stderr)
        sys.exit(1)

    feed_id = sys.argv[1]
    signaling_url = sys.argv[2]

    try:
        asyncio.run(run(feed_id, signaling_url))
    except KeyboardInterrupt:
        logger.info("Terminated by user")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        sys.exit(1)