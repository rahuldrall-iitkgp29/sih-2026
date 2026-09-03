"""Caption Model Adapter for remote-sensing scene description."""
from typing import Dict, Any
from app.models.base_model import RemoteSensingModel, ModelInput, ModelOutput, ModelStatus


class CaptionModel(RemoteSensingModel):
    def load(self) -> None:
        if not self.is_configured:
            return
        print(f"  Caption model configured: {self.model_id} (Routing to VQAModel)")
        self.status = ModelStatus.READY

    def predict(self, input_data: ModelInput) -> ModelOutput:
        from app.models.registry import model_registry
        vqa_model = model_registry.get("rs-vqa")
        
        if not vqa_model or not vqa_model.is_loaded:
            return ModelOutput(success=False, status=ModelStatus.ERROR, model=self.model_id, task="CAPTION", confidence=0.0,
                               data={"error": "Underlying VQA model not loaded"})
        
        # Override query for captioning
        input_data.query = "Describe this satellite image in detail."
        
        # Delegate to VQAModel
        result = vqa_model.predict(input_data)
        
        # Reformat output for Caption task
        result.task = "CAPTION"
        if "answer" in result.data:
            result.data["caption"] = result.data.pop("answer")
            
        return result

    def get_metadata(self) -> Dict[str, Any]:
        return {"name": "Remote Sensing Captioning", "task": "CAPTION",
                "modalities": ["SINGLE_IMAGE"],
                "description": "Scene description and captioning for satellite imagery (Powered by GeoChat)"}
