from fastapi import APIRouter, UploadFile, File, Form
from app.models.registry import model_registry
from app.models.base_model import ModelInput, ModelStatus
from app.utils.image_processing import load_image_from_bytes, extract_image_metadata

router = APIRouter()

@router.post("/grounding")
async def grounding_endpoint(image: UploadFile = File(...), query: str = Form(...)):
    model = model_registry.get("rs-grounding")
    if not model or not model.is_loaded:
        status = model.status if model else ModelStatus.NOT_CONFIGURED
        msg = "No Grounding specialist model is configured." if status == ModelStatus.NOT_CONFIGURED else f"Grounding model is currently {status}"
        return {"success": False, "task": "grounding", "status": status, "model": model.model_id if model else None, "message": msg}

    try:
        image_bytes = await image.read()
        metadata = extract_image_metadata(image_bytes)
        img_array = load_image_from_bytes(image_bytes, image.filename)
        input_data = ModelInput(images=[img_array], query=query, parameters={"image_metadata": metadata})
        result = model.predict(input_data)
        return {"success": result.success, "task": result.task, "status": ModelStatus.READY, "model": result.model, "boxes": result.data.get("boxes", []), "labels": result.data.get("labels", []), "confidence": result.confidence, "metadata": result.metadata, "answer": result.data.get("answer", "")}
    except Exception as e:
        return {"success": False, "task": "grounding", "status": ModelStatus.ERROR, "model": model.model_id, "message": f"Inference error: {str(e)}"}
