"""Change Detection Model Adapter for bi-temporal satellite imagery."""
from typing import Dict, Any
from app.models.base_model import RemoteSensingModel, ModelInput, ModelOutput, ModelStatus


class ChangeModel(RemoteSensingModel):
    def load(self) -> None:
        if not self.is_configured:
            return
        # INTEGRATION POINT: Load change detection model (e.g., BIT, ChangeFormer, SNUNet)
        print(f"  Change detection model configured: {self.model_id}")
        self.status = ModelStatus.READY

    def predict(self, input_data: ModelInput) -> ModelOutput:
        if not self.is_loaded:
            return ModelOutput(success=False, status=ModelStatus.ERROR, model="change-model", task="CHANGE_ANALYSIS", confidence=0.0,
                               data={"error": "Model not loaded"})
        return ModelOutput(success=False, status=ModelStatus.ERROR, model=self.model_id, task="CHANGE_ANALYSIS", confidence=0.0,
                           data={"error": "Inference not implemented"})

    def get_metadata(self) -> Dict[str, Any]:
        return {"name": "Change Detection", "task": "CHANGE_ANALYSIS",
                "modalities": ["BI_TEMPORAL"],
                "description": "Bi-temporal change analysis for satellite imagery pairs"}
