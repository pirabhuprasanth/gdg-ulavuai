import os
import cv2
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.preprocessing import image
from tensorflow.keras.models import load_model
import uvicorn

# -----------------------------
# Load the Model
# -----------------------------
model_path = "best_model.h5"
model = load_model(model_path)

class_names = ['ants', 'bees', 'beetle', 'catterpillar', 'earthworms', 'earwig',
               'grasshopper', 'moth', 'slug', 'snail', 'wasp', 'weevil']
img_size = (224, 224)

# -----------------------------
# FastAPI Setup
# -----------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Helper Functions
# -----------------------------
def preprocess_image(file_bytes):
    img = image.load_img(file_bytes, target_size=img_size)
    img_array = image.img_to_array(img)
    img_array = tf.expand_dims(img_array, 0)
    return tf.keras.applications.efficientnet.preprocess_input(img_array)

def predict(image_tensor):
    predictions = model.predict(image_tensor, verbose=0)
    predicted_index = int(tf.argmax(predictions[0]))
    confidence = float(predictions[0][predicted_index])
    label = class_names[predicted_index]
    
    # Check if confidence is above 30% for an insect class
    insect_classes = ['ants', 'bees', 'beetle', 'catterpillar', 'earwig', 'grasshopper', 'moth', 'slug', 'snail', 'wasp', 'weevil']
    flag = label in insect_classes and confidence > 0.30
    
    return label, confidence, flag

# -----------------------------
# Endpoints
# -----------------------------
@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...)):
    contents = await file.read()
    with open("temp.jpg", "wb") as f:
        f.write(contents)

    tensor = preprocess_image("temp.jpg")
    label, confidence, flag = predict(tensor)
    os.remove("temp.jpg")
    return JSONResponse({"prediction": label, "confidence": round(confidence, 2), "flag": flag})

@app.post("/predict/video")
async def predict_video(file: UploadFile = File(...)):
    contents = await file.read()
    with open("temp_video.mp4", "wb") as f:
        f.write(contents)
    cap = cv2.VideoCapture("temp_video.mp4")
    frame_count = 0
    results = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret or frame_count >= 10:
            break
        frame_resized = cv2.resize(frame, img_size)
        input_tensor = tf.expand_dims(tf.keras.applications.efficientnet.preprocess_input(frame_resized.astype("float32")), 0)
        label, confidence, flag = predict(input_tensor)
        results.append({"frame": frame_count, "prediction": label, "confidence": round(confidence, 2), "flag": flag})
        frame_count += 1
    cap.release()
    os.remove("temp_video.mp4")
    return JSONResponse({"predictions": results})

@app.get("/predict/webcam")
def predict_webcam():
    cap = cv2.VideoCapture(0)
    predictions = []
    frame_count = 0

    while cap.isOpened() and frame_count < 10:
        ret, frame = cap.read()
        if not ret:
            break
        frame_resized = cv2.resize(frame, img_size)
        input_tensor = tf.expand_dims(tf.keras.applications.efficientnet.preprocess_input(frame_resized.astype("float32")), 0)
        label, confidence, flag = predict(input_tensor)
        predictions.append({"frame": frame_count, "prediction": label, "confidence": round(confidence, 2), "flag": flag})
        frame_count += 1

    cap.release()
    return JSONResponse({"predictions": predictions})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3665, reload=True)