"""Grounding Model Adapter for text-guided region detection."""
from typing import Dict, Any
from app.models.base_model import RemoteSensingModel, ModelInput, ModelOutput, ModelStatus
import re

class GroundingModel(RemoteSensingModel):
    def load(self) -> None:
        if not self.is_configured:
            return
        print(f"  Grounding model configured: {self.model_id} (Routing to VQAModel)")
        self.status = ModelStatus.READY

    def predict(self, input_data: ModelInput) -> ModelOutput:
        from app.models.registry import model_registry
        vqa_model = model_registry.get("rs-vqa")
        
        if not vqa_model or not vqa_model.is_loaded:
            return ModelOutput(success=False, status=ModelStatus.ERROR, model=self.model_id, task="GROUNDING", confidence=0.0,
                               data={"error": "Underlying VQA model not loaded"})
        
        # Override query for grounding format required by GeoChat
        original_query = input_data.query
        input_data.query = f"Please provide the bounding box coordinate of the region this sentence describes: {original_query}"
        
        # Delegate to VQAModel
        result = vqa_model.predict(input_data)
        
        # Reformat output for Grounding task
        result.task = "GROUNDING"
        if "answer" in result.data:
            answer_text = result.data.get("answer", "")
            
            # Very basic extraction of boxes like [0.1, 0.2, 0.3, 0.4] if generated
            boxes = []
            labels = []
            try:
                # GeoChat sometimes outputs tags like <box> or raw brackets. This is a heuristic extraction.
                matches = re.findall(r'\[([\d\.\s,]+)\]', answer_text)
                for match in matches:
                    coords = [float(x.strip()) for x in match.split(',')]
                    if len(coords) == 4:
                        boxes.append(coords)
                        labels.append(original_query)
            except Exception:
                pass
                
            result.data["boxes"] = boxes
            result.data["labels"] = labels
            
        return result

    def get_metadata(self) -> Dict[str, Any]:
        return {"name": "Remote Sensing Grounding", "task": "GROUNDING",
                "modalities": ["SINGLE_IMAGE"],
                "description": "Text-guided region grounding in remote-sensing images (Powered by GeoChat)"}
