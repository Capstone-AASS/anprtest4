from utils.ANPRPipelineWithTracking import ANPRPipelineWithTracking

import cv2
from utils.NumberPlatePredictor import NumberPlatePredictor


# Define the paths to the YOLO model weights
plate_model_path = "best_l.pt"
char_model_path = "best_char_200.pt"

# video_path = r"C:\Users\samar\Desktop\capstone\anprtest4\videos\192.168.1.108_IP Camera_main_20241115162510.mp4"
video_path = "rtsp://admin:123456@192.168.1.14/stream"
# video_path = r"E:\Tech\Python\Projects\Automobile Automobile Surveillance System\Capstone Data\2.mp4"

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
    "PB03MF4477"
]

# Initialize the ANPR pipeline with tracking
anpr_pipeline = ANPRPipelineWithTracking(plate_model_path, char_model_path)
number_plate_predictor = NumberPlatePredictor(number_plate_db)

cap = cv2.VideoCapture(video_path)
# cap = cv2.VideoCapture(0,cv2.CAP_DSHOW)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Detect number plates and draw bounding boxes
    plates = anpr_pipeline.detect_number_plate(frame)
    number_plate_text = ""
    if plates:
        tracked_plates = anpr_pipeline.track_number_plates(frame, plates)

        number_plates = anpr_pipeline.get_plate_text(frame, tracked_plates)
        result_image = anpr_pipeline.draw_bounding_boxes(frame, plates)
        # anpr_pipeline.show_results(frame, plates)
        for number_plate in number_plates:
            # print(number_plate)
            # print(number_plate)
            number_plate_text = number_plate_predictor.update_history(
                number_plate[0], number_plate[1]
            )

    else:
        # No number plates detected
        result_image = frame
    result_image = cv2.resize(result_image, (1280, 720))
    if number_plate_text:
        # print(number_plate_text)
        # print(type(number_plate_text))
        cv2.putText(
            result_image,
            number_plate_text[0],
            (200, 200),
            cv2.FONT_HERSHEY_SIMPLEX,
            4,
            (0, 255, 0),
            4,
        )
    cv2.imshow("Detected Number Plates", result_image)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Release the capture and close windows
cap.release()
cv2.destroyAllWindows()
