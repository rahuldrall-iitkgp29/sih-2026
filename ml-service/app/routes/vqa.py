from fastapi import APIRouter, UploadFile, File, Form
from app.models.registry import model_registry
from app.models.base_model import ModelInput, ModelStatus
from app.utils.image_processing import load_image_from_bytes

router = APIRouter()

@router.post("/vqa")
async def vqa_endpoint(image: UploadFile = File(...), query: str = Form(...)):
    model = model_registry.get("rs-vqa")
    if not model or not model.is_loaded:
        status = model.status if model else ModelStatus.NOT_CONFIGURED
        return {
            "success": False, 
            "task": "vqa", 
            "status": "MODEL_NOT_CONFIGURED" if status == ModelStatus.NOT_CONFIGURED else status, 
            "model": None, 
            "message": "GeoChat VQA model is not ready."
        }

    try:
        image_bytes = await image.read()
        img_array = load_image_from_bytes(image_bytes, image.filename)
        input_data = ModelInput(images=[img_array], query=query)
        result = model.predict(input_data)
        
        if not result.success:
             return {
                "success": False, 
                "task": "vqa", 
                "status": result.status, 
                "model": result.model, 
                "message": result.message
            }
            
        return {
            "success": True, 
            "task": "vqa", 
            "status": "completed", 
            "model": result.model or "GeoChat", 
            "answer": result.data.get("answer", ""), 
            "confidence": result.confidence, 
            "evidence": result.data.get("evidence", []), 
            "metadata": result.metadata
        }
    except Exception as e:
        return {
            "success": False, 
            "task": "vqa", 
            "status": ModelStatus.ERROR, 
            "model": model.model_id if model else None, 
            "message": f"Endpoint error: {str(e)}"
        }
