from ultralytics import YOLO

import os

if __name__ == "__main__fv":
    # Load a model 
    model = YOLO("./best.pt")

    # Customize validation settings
    validation_results = model.val(data='config.yaml',
                               imgsz=640,
                               batch=16,
                               conf=0.25,
                               iou=0.6,
                               device='0')