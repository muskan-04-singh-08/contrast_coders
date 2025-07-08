from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from PIL import Image
import numpy as np
import io
import tensorflow as tf

print(tf.__version__)

app = FastAPI()

# Load your trained model
# model = tf.keras.models.load_model("model.keras")

# Define patch sizes
LR_PATCH_SIZE = 128  # Example
HR_PATCH_SIZE = 512  # Example

# @app.post("/enhance-image/")
# async def enhance_image(file: UploadFile = File(...)):
#     # Load image from upload
#     image = Image.open(file.file).convert("RGB")

#     # Resize and normalize image
#     lr_img = image.resize((LR_PATCH_SIZE, LR_PATCH_SIZE), Image.BICUBIC)
#     lr_array = np.array(lr_img).astype(np.float32) / 255.0
    # lr_tensor = tf.expand_dims(lr_array, axis=0)  # Add batch dimension

    # Predict enhanced image
    # sr_tensor = model.predict(lr_tensor)
    # sr_image = tf.squeeze(sr_tensor).numpy()
    # sr_image = np.clip(sr_image * 255.0, 0, 255).astype(np.uint8)

    # # Convert to PIL image for response
    # result_img = Image.fromarray(sr_image)

    # # Save image to memory stream
    # img_bytes = io.BytesIO()
    # result_img.save(img_bytes, format='PNG')
    # img_bytes.seek(0)

    # return StreamingResponse(img_bytes, media_type="image/png")
