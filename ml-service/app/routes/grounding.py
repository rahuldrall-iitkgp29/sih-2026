"""Grounding route — POST /ml/grounding"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File, Form
from app.models.registry import model_registry
from app.models.base_model import ModelInput
from app.utils.image_processing import load_image_from_bytes

router = APIRouter()

@router.post("/grounding")
async def grounding_endpoint(image: UploadFile = File(...), query: str = Form(...)):
    model = model_registry.get("rs-grounding")
    if not model or not model.is_loaded:
        return {"success": False, "model": "rs-grounding", "task": "GROUNDING",
                "error": "Grounding model not loaded", "confidence": 0.0}

    image_bytes = await image.read()
    img_array = load_image_from_bytes(image_bytes)
    result = model.predict(ModelInput(images=[img_array], query=query))

    return {"success": result.success, "model": result.model, "task": result.task,
            "boxes": result.data.get("boxes", []), "labels": result.data.get("labels", []),
            "confidence": result.confidence, "mask": result.data.get("mask"),
            "metadata": result.metadata}
