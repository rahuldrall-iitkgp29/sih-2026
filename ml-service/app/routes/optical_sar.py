"""Optical-SAR route — POST /ml/optical-sar"""
from fastapi import APIRouter, UploadFile, File, Form
from app.models.registry import model_registry
from app.models.base_model import ModelInput
from app.utils.image_processing import load_image_from_bytes

router = APIRouter()

@router.post("/optical-sar")
async def optical_sar_endpoint(
    optical: UploadFile = File(...), sar: UploadFile = File(...),
    query: str = Form(""),
):
    model = model_registry.get("optical-sar-fusion")
    if not model or not model.is_loaded:
        return {"success": False, "model": "optical-sar-fusion", "task": "OPTICAL_SAR_ANALYSIS",
                "error": "Optical-SAR model not loaded", "confidence": 0.0}

    img_opt = load_image_from_bytes(await optical.read())
    img_sar = load_image_from_bytes(await sar.read())
    result = model.predict(ModelInput(images=[img_opt, img_sar], query=query))

    return {"success": result.success, "model": result.model, "task": result.task,
            "analysis": result.data.get("analysis", ""), "confidence": result.confidence,
            "regions": result.data.get("regions", []), "metadata": result.metadata}
