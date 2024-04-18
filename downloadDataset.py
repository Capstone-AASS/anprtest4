import os
from dotenv import load_dotenv
from roboflow import Roboflow
load_dotenv()

# put your api key in a .env file
rf = Roboflow(api_key=os.getenv('ROBOFLOW_API_KEY'))
project = rf.workspace("roboflow-universe-projects").project("license-plate-recognition-rxg4e")
version = project.version(4)
dataset = version.download("yolov8")
