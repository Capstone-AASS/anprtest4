from ultralytics import YOLO

if __name__ == "__main__":
    # LOAD MODEL
    model = YOLO('./models/yolov8n.pt')

    # TRAIN THE MODEL
    results = model.train(data = 'config.yaml',imgsz=640,epochs =10)