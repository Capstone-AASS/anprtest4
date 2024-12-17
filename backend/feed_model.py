# feed.py

import cv2
import base64
import asyncio
import websockets
import json
import sys
import os

# import sys
# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

from utils.ANPRPipelineWithTracking import ANPRPipelineWithTracking
from utils.NumberPlatePredictor import NumberPlatePredictor

# Define the paths to the YOLO model weights
plate_model_path = r"../best_l.pt"
char_model_path = r"../best_char_200.pt"

# video_path = r"C:\Users\samar\Desktop\capstone\anprtest4\videos\192.168.1.108_IP Camera_main_20241115162510.mp4"
# video_path = "rtsp://admin:123456@192.168.1.14/stream"
video_path = r"C:\Users\samar\Desktop\capstone\anprtest4\capstone_data\Main_Gate_Entry-_New_TIET_Gates_TIET_Gates_20241202084658_20241202092633_202008.mp4"

# define example numberplates or fetch from DB
number_plate_db = [
    "HR01AR4949",
    "PB01A4470",
    "PB01D4802",
    "PB11DB4699",
    "PB11DF1112",
    "PB11DG8713",
    "PB11V0012",
    "PB13AN9198",
    "PB13AW0055",
    "PB23U1292",
    "PB31N1297",
    "PB39B0002",
    "HP02Z1086",
    "PB11DC0012",
    "PB91D2222",
    "PB11DB5138",
    "PB91N0593",
    "PB11DD2667",
    "T1024PB0311G",
    "CH02AA8347",
    "CH01AM1485",
    "UP15CX4041",
    "PB23U1292",
    "PB11DC0012",
    "PB11BB9800",
]

# Initialize the ANPR pipeline with tracking
anpr_pipeline = ANPRPipelineWithTracking(plate_model_path, char_model_path)
number_plate_predictor = NumberPlatePredictor(number_plate_db)


async def send_video(websocket, path, feedId):
    if path != f"/{feedId}":
        await websocket.close()
        print(f"Unsupported path: {path}", file=sys.stderr)
        return

    print(f"Accepted connection on path: {path} with feedId: {feedId}")
    # camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)  # Modify as needed for different feeds
    # camera = cv2.VideoCapture(0)  # Modify as needed for different feeds
    camera = cv2.VideoCapture(video_path)  # Modify as needed for different feeds
    if not camera.isOpened():
        print("Failed to open camera", file=sys.stderr)
        await websocket.close()
        return

    try:
        while True:
            ret, frame = camera.read()
            if not ret:
                print("Failed to read frame from camera", file=sys.stderr)
                break

            # Detect number plates and draw bounding boxes
            plates = anpr_pipeline.detect_number_plate(frame)
            number_plate_text = ""
            if plates:
                tracked_plates = anpr_pipeline.track_number_plates(frame, plates)

                number_plates = anpr_pipeline.get_plate_text(frame, tracked_plates)
                result_image = anpr_pipeline.draw_bounding_boxes(frame, plates)
                for number_plate in number_plates:
                    number_plate_text = number_plate_predictor.update_history(
                        number_plate[0], number_plate[1]
                    )
            else:
                # No number plates detected
                result_image = frame

            # Write numberplate data
            if number_plate_text:
                cv2.putText(
                    result_image,
                    number_plate_text,
                    (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    4,
                    (123, 69, 90),
                    4,
                )

            # Encode the frame to JPEG
            _, buffer = cv2.imencode(".jpg", result_image)
            frame_data = base64.b64encode(buffer).decode("utf-8")

            # Create the message with feedId and frame data
            message = {
                "type": "videoFrame",
                "data": {"feedId": feedId, "frame": frame_data},
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
    if len(sys.argv) != 2:
        print("Usage: python feed_model.py <feedId>", file=sys.stderr)
        sys.exit(1)

    feedId = sys.argv[1]
    port = 3000  # Base port; will increment based on feedId

    # Map feedId to port
    try:
        feed_number = int(feedId.replace("feed", ""))
        port = 3000 + feed_number  # e.g., feed16 -> 3016
    except ValueError:
        print("Invalid feedId format. Use 'feed<number>'", file=sys.stderr)
        sys.exit(1)

    start_server = websockets.serve(
        lambda ws, path: send_video(ws, path, feedId), "0.0.0.0", port
    )
    asyncio.get_event_loop().run_until_complete(start_server)
    print(
        f"Python WebSocket server for {feedId} started on ws://0.0.0.0:{port}/{feedId}"
    )
    asyncio.get_event_loop().run_forever()
