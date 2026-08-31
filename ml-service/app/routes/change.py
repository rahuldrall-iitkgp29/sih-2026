"""Change Detection route — POST /ml/change"""
from fastapi import APIRouter, UploadFile, File, Form
from app.models.registry import model_registry
from app.models.base_model import ModelInput
from app.utils.image_processing import load_image_from_bytes

router = APIRouter()

@router.post("/change")
async def change_endpoint(
    image1: UploadFile = File(...), image2: UploadFile = File(...),
    query: str = Form(""),
):
    model = model_registry.get("change-detection")
    if not model or not model.is_loaded:
        return {"success": False, "model": "change-detection", "task": "CHANGE_ANALYSIS",
                "error": "Change detection model not loaded", "confidence": 0.0}

    img1 = load_image_from_bytes(await image1.read())
    img2 = load_image_from_bytes(await image2.read())
    result = model.predict(ModelInput(images=[img1, img2], query=query))

    return {"success": result.success, "model": result.model,
            "changeDetected": result.data.get("changeDetected", False),
            "description": result.data.get("description", ""),
            "confidence": result.confidence,
            "changePercentage": result.data.get("changePercentage", 0),
            "mask": result.data.get("mask"), "metadata": result.metadata}
