"""Change VQA Model Adapter for answering questions about bi-temporal changes."""
from typing import Dict, Any
from app.models.base_model import RemoteSensingModel, ModelInput, ModelOutput, ModelStatus


class ChangeVQAModel(RemoteSensingModel):
    def load(self) -> None:
        if not self.is_configured:
            return
        # INTEGRATION POINT: Load Change VQA model (e.g., CDVQA models)
        print(f"  Change VQA model configured: {self.model_id}")
        self.status = ModelStatus.READY

    def predict(self, input_data: ModelInput) -> ModelOutput:
        if not self.is_loaded:
            return ModelOutput(success=False, status=ModelStatus.ERROR, model="change-vqa-model", task="CHANGE_VQA", confidence=0.0,
                               data={"error": "Model not loaded"})
        return ModelOutput(success=False, status=ModelStatus.ERROR, model=self.model_id, task="CHANGE_VQA", confidence=0.0,
                           data={"error": "Inference not implemented"})

    def get_metadata(self) -> Dict[str, Any]:
        return {"name": "Change VQA", "task": "CHANGE_VQA",
                "modalities": ["BI_TEMPORAL"],
                "description": "Visual Question Answering for bi-temporal change imagery"}
