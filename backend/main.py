from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from PIL import Image
import numpy as np
import io
import tempfile
import tensorflow as tf
from model import model, LR_PATCH_SIZE
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_QUEUE_SIZE = 10
image_queue = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)


@app.get("/")
async def root():
    return {"message": "Hello World"}


async def process_image(file: UploadFile) -> bytes:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    image = Image.open(tmp_path).convert("RGB")
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

    return img_bytes.read()


@app.post("/enhance-image/")
async def enhance_multiple_images(files: List[UploadFile] = File(...)):
    results = []

    for file in files:
        if image_queue.full():
            return {"error": "Server busy. Try again later."}

        await image_queue.put(file)

        image_data = await process_image(file)
        results.append(image_data)

        image_queue.get_nowait()
        image_queue.task_done()

    import zipfile

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
        for idx, data in enumerate(results):
            zipf.writestr(f"enhanced_{idx:02d}.png", data)

    zip_buffer.seek(0)
    return StreamingResponse(zip_buffer, media_type="application/zip")
