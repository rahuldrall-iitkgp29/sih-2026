from fastapi import APIRouter, UploadFile, File
from app.models.registry import model_registry
from app.models.base_model import ModelInput, ModelStatus
from app.utils.image_processing import validate_image_pair

router = APIRouter()

@router.post("/change")
async def change_endpoint(image_t1: UploadFile = File(...), image_t2: UploadFile = File(...)):
    model = model_registry.get("change-detection")
    if not model or not model.is_loaded:
        status = model.status if model else ModelStatus.NOT_CONFIGURED
        msg = "No Change Detection specialist model is configured." if status == ModelStatus.NOT_CONFIGURED else f"Change model is currently {status}"
        return {"success": False, "task": "change", "status": status, "model": model.model_id if model else None, "message": msg}

    try:
        b1, b2 = await image_t1.read(), await image_t2.read()
        img1, img2 = validate_image_pair(b1, b2, image_t1.filename, image_t2.filename)
        input_data = ModelInput(images=[img1, img2])
        result = model.predict(input_data)
        return {"success": result.success, "task": result.task, "status": ModelStatus.READY, "model": result.model, "change_detected": result.data.get("change_detected", False), "change_percentage": result.data.get("change_percentage", 0.0), "confidence": result.confidence, "metadata": result.metadata}
    except ValueError as ve:
        return {"success": False, "task": "change", "status": ModelStatus.ERROR, "model": model.model_id, "message": f"Validation error: {str(ve)}"}
    except Exception as e:
        return {"success": False, "task": "change", "status": ModelStatus.ERROR, "model": model.model_id, "message": f"Inference error: {str(e)}"}
