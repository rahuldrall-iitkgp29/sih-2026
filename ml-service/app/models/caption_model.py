"""Caption Model Adapter for remote-sensing scene description."""
from typing import Dict, Any
from app.models.base_model import RemoteSensingModel, ModelInput, ModelOutput


class CaptionModel(RemoteSensingModel):
    def load(self) -> None:
        if not self.is_configured:
            return
        # INTEGRATION POINT: Load captioning model (e.g., BLIP, GIT, RS-specific)
        print(f"  Caption model configured: {self.model_id}")

    def predict(self, input_data: ModelInput) -> ModelOutput:
        if not self._loaded:
            return ModelOutput(success=False, model="caption-model", task="CAPTION", confidence=0.0,
                               data={"error": "Model not loaded"})
        # INTEGRATION POINT: Run caption inference
        return ModelOutput(success=False, model=self.model_id, task="CAPTION", confidence=0.0,
                           data={"error": "Inference not implemented"})

    def get_metadata(self) -> Dict[str, Any]:
        return {"name": "Remote Sensing Captioning", "task": "CAPTION",
                "modalities": ["SINGLE_IMAGE"],
                "description": "Scene description and captioning for satellite imagery"}
