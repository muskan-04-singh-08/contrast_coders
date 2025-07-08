from fastapi import FastAPI
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from PIL import Image
import numpy as np
import io
import tensorflow as tf
from model import model, LR_PATCH_SIZE
import tempfile
from keras.preprocessing.image import load_img
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/enhance-image/")
async def enhance_image(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name
    image = load_img(tmp_path)
    lr_img = image.resize((LR_PATCH_SIZE, LR_PATCH_SIZE), Image.BICUBIC)
    lr_array = np.array(lr_img).astype(np.float32) / 255.0
    lr_tensor = tf.expand_dims(lr_array, axis=0)

    sr_tensor = model.predict(lr_tensor)
    sr_image = tf.squeeze(sr_tensor).numpy()
    sr_image = np.clip(sr_image * 255.0, 0, 255).astype(np.uint8)

    result_img = Image.fromarray(sr_image)
    img_bytes = io.BytesIO()
    result_img.save(img_bytes, format="PNG")
    img_bytes.seek(0)

    return StreamingResponse(img_bytes, media_type="image/png")