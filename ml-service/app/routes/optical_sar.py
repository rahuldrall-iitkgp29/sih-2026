from fastapi import APIRouter, UploadFile, File, Form
from app.models.registry import model_registry
from app.models.base_model import ModelInput, ModelStatus
from app.utils.image_processing import validate_image_pair

router = APIRouter()

@router.post("/optical-sar")
async def optical_sar_endpoint(optical_image: UploadFile = File(...), sar_image: UploadFile = File(...), query: str = Form(...)):
    model = model_registry.get("optical-sar-fusion")
    if not model or not model.is_loaded:
        status = model.status if model else ModelStatus.NOT_CONFIGURED
        msg = "No Optical-SAR specialist model is configured." if status == ModelStatus.NOT_CONFIGURED else f"Optical-SAR model is currently {status}"
        return {"success": False, "task": "optical-sar", "status": status, "model": model.model_id if model else None, "message": msg}

    try:
        b1, b2 = await optical_image.read(), await sar_image.read()
        img1, img2 = validate_image_pair(b1, b2, optical_image.filename, sar_image.filename)
        input_data = ModelInput(images=[img1, img2], query=query)
        result = model.predict(input_data)
        return {"success": result.success, "task": result.task, "status": ModelStatus.READY, "model": result.model, "answer": result.data.get("answer", ""), "confidence": result.confidence, "metadata": result.metadata}
    except ValueError as ve:
        return {"success": False, "task": "optical-sar", "status": ModelStatus.ERROR, "model": model.model_id, "message": f"Validation error: {str(ve)}"}
    except Exception as e:
        return {"success": False, "task": "optical-sar", "status": ModelStatus.ERROR, "model": model.model_id, "message": f"Inference error: {str(e)}"}
