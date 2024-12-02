# feed.py
import cv2
import base64
import asyncio
import websockets
import json
import sys

async def send_video(feedId, websocket_url):
    async with websockets.connect(websocket_url, compression=None) as websocket:
        camera = cv2.VideoCapture(0)  # Modify as needed for different feeds

        if not camera.isOpened():
            print("Failed to open camera", file=sys.stderr)
            return

        try:
            while True:
                ret, frame = camera.read()
                if not ret:
                    print("Failed to read frame from camera", file=sys.stderr)
                    break

                # Encode the frame to JPEG
                _, buffer = cv2.imencode('.jpg', frame)
                frame_data = base64.b64encode(buffer).decode('utf-8')

                # Create the message with feedId and frame data
                message = {
                    'type': 'videoData',
                    'data': {
                        'feedId': feedId,
                        'frame': frame_data
                    }
                }

                await websocket.send(json.dumps(message))

                # Control frame rate (~30 fps)
                await asyncio.sleep(0.033)
        except websockets.exceptions.ConnectionClosed:
            print("WebSocket connection closed", file=sys.stderr)
        finally:
            camera.release()
            print("Camera released")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python feed.py <feedId> <websocket_url>", file=sys.stderr)
        sys.exit(1)

    feedId = sys.argv[1]
    websocket_url = sys.argv[2]

    asyncio.get_event_loop().run_until_complete(send_video(feedId, websocket_url))