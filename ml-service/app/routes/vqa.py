"""VQA route — POST /ml/vqa"""

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File, Form
from app.models.registry import model_registry
from app.models.base_model import ModelInput
from app.utils.image_processing import load_image_from_bytes

router = APIRouter()


@router.post("/vqa")
async def vqa_endpoint(
    image: UploadFile = File(...),
    query: str = Form(...),
):
    model = model_registry.get("rs-vqa")
    if not model or not model.is_loaded:
        return {"success": False, "model": "rs-vqa", "task": "VQA",
                "error": "VQA model not loaded", "confidence": 0.0}

    image_bytes = await image.read()
    img_array = load_image_from_bytes(image_bytes)
    input_data = ModelInput(images=[img_array], query=query)
    result = model.predict(input_data)

    return {
        "success": result.success,
        "model": result.model,
        "task": result.task,
        "answer": result.data.get("answer", ""),
        "confidence": result.confidence,
        "evidence": result.data.get("evidence", []),
        "metadata": result.metadata,
    }
