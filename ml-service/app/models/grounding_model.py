"""Grounding Model Adapter for text-guided region detection."""
from typing import Dict, Any
from app.models.base_model import RemoteSensingModel, ModelInput, ModelOutput


class GroundingModel(RemoteSensingModel):
    def load(self) -> None:
        if not self.is_configured:
            return
        # INTEGRATION POINT: Load grounding model (e.g., GroundingDINO, YOLO-World)
        print(f"  Grounding model configured: {self.model_id}")

    def predict(self, input_data: ModelInput) -> ModelOutput:
        if not self._loaded:
            return ModelOutput(success=False, model="grounding-model", task="GROUNDING", confidence=0.0,
                               data={"error": "Model not loaded"})
        return ModelOutput(success=False, model=self.model_id, task="GROUNDING", confidence=0.0,
                           data={"error": "Inference not implemented"})

    def get_metadata(self) -> Dict[str, Any]:
        return {"name": "Remote Sensing Grounding", "task": "GROUNDING",
                "modalities": ["SINGLE_IMAGE"],
                "description": "Text-guided region grounding in remote-sensing images"}
