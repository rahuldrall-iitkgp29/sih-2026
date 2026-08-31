from fastapi import APIRouter, UploadFile, File
from app.models.registry import model_registry
from app.models.base_model import ModelInput, ModelStatus
from app.utils.image_processing import load_image_from_bytes

router = APIRouter()

@router.post("/caption")
async def caption_endpoint(image: UploadFile = File(...)):
    model = model_registry.get("rs-caption")
    if not model or not model.is_loaded:
        status = model.status if model else ModelStatus.NOT_CONFIGURED
        msg = "No Caption specialist model is configured." if status == ModelStatus.NOT_CONFIGURED else f"Caption model is currently {status}"
        return {"success": False, "task": "caption", "status": status, "model": model.model_id if model else None, "message": msg}

    try:
        image_bytes = await image.read()
        img_array = load_image_from_bytes(image_bytes, image.filename)
        input_data = ModelInput(images=[img_array])
        result = model.predict(input_data)
        return {"success": result.success, "task": result.task, "status": ModelStatus.READY, "model": result.model, "caption": result.data.get("caption", ""), "confidence": result.confidence, "metadata": result.metadata}
    except Exception as e:
        return {"success": False, "task": "caption", "status": ModelStatus.ERROR, "model": model.model_id, "message": f"Inference error: {str(e)}"}
