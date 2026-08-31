"""Caption route — POST /ml/caption"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File
from app.models.registry import model_registry
from app.models.base_model import ModelInput
from app.utils.image_processing import load_image_from_bytes

router = APIRouter()

@router.post("/caption")
async def caption_endpoint(image: UploadFile = File(...)):
    model = model_registry.get("rs-caption")
    if not model or not model.is_loaded:
        return {"success": False, "model": "rs-caption", "task": "CAPTION",
                "error": "Caption model not loaded", "confidence": 0.0}

    image_bytes = await image.read()
    img_array = load_image_from_bytes(image_bytes)
    result = model.predict(ModelInput(images=[img_array]))

    return {"success": result.success, "model": result.model, "task": result.task,
            "caption": result.data.get("caption", ""), "confidence": result.confidence,
            "metadata": result.metadata}
