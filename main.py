from ultralytics import YOLO

# LOAD MODEL
model = YOLO('./models/yolov8n.pt')

# TRAIN THE MODEL
results = model.train()