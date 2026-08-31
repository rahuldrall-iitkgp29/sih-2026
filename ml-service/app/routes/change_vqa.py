"""Change VQA route — POST /ml/change-vqa"""
from fastapi import APIRouter, UploadFile, File, Form
from app.models.registry import model_registry
from app.models.base_model import ModelInput
from app.utils.image_processing import load_image_from_bytes

router = APIRouter()

@router.post("/change-vqa")
async def change_vqa_endpoint(
    image1: UploadFile = File(...), image2: UploadFile = File(...),
    query: str = Form(...),
):
    model = model_registry.get("change-vqa")
    if not model or not model.is_loaded:
        return {"success": False, "model": "change-vqa", "task": "CHANGE_VQA",
                "error": "Change VQA model not loaded", "confidence": 0.0}

    img1 = load_image_from_bytes(await image1.read())
    img2 = load_image_from_bytes(await image2.read())
    result = model.predict(ModelInput(images=[img1, img2], query=query))

    return {"success": result.success, "model": result.model, "task": result.task,
            "answer": result.data.get("answer", ""), "confidence": result.confidence,
            "evidence": result.data.get("evidence", []), "metadata": result.metadata}
