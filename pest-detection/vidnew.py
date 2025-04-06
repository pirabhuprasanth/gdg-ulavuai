import cv2
import tensorflow as tf
import numpy as np

# -----------------------------
# Load the Model
# -----------------------------
model_path = "best_model.h5"
model = tf.keras.models.load_model(model_path)
print("[INFO] Model loaded successfully.")

# -----------------------------
# Class Names (adjust if needed)
# -----------------------------
class_names = ['ants', 'bees', 'beetle', 'catterpillar', 'earthworms', 'earwig',
               'grasshopper', 'moth', 'slug', 'snail', 'wasp', 'weevil']

# -----------------------------
# Video Source
# -----------------------------
# Use 0 for webcam or provide path to a video file like "video.mp4"
video_source = 0 # Change to "your_video.mp4" if testing with file

cap = cv2.VideoCapture(video_source)

img_size = (224, 224)

# -----------------------------
# Frame Preprocessing
# -----------------------------
def preprocess_frame(frame):
    frame_resized = cv2.resize(frame, img_size)
    img_array = tf.keras.applications.efficientnet.preprocess_input(frame_resized.astype("float32"))
    return tf.expand_dims(img_array, 0)

# -----------------------------
# Video Loop
# -----------------------------
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Preprocess and predict
    input_tensor = preprocess_frame(frame)
    predictions = model.predict(input_tensor, verbose=0)
    predicted_index = int(tf.argmax(predictions[0]))
    confidence = predictions[0][predicted_index]
    predicted_class = class_names[predicted_index]

    # Display prediction
    label = f"{predicted_class} ({confidence:.2f})"
    cv2.putText(frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.imshow("Real-Time Insect Prediction", frame)

    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
