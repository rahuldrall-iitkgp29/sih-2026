"""
VQA Model Adapter.
"""
from typing import Dict, Any
from app.models.base_model import RemoteSensingModel, ModelInput, ModelOutput, ModelStatus
import numpy as np
from PIL import Image
import os

class VQAModel(RemoteSensingModel):
    """Visual Question Answering model adapter for remote-sensing imagery using GeoChat."""

    def load(self) -> None:
        if not self.is_configured:
            return

        print(f"  [VQA] Preparing GeoChat VQA model adapter for ID: {self.model_id}, Path: {self.model_path}")
        
        self._processor = None
        self._model = None
        
        # We do not actually load the model yet since the download might be incomplete.
        # But we prepare the logic.
        if self.model_path and not os.path.exists(os.path.join(self.model_path, "config.json")):
            self.set_error("GeoChat VQA model is not ready.")
            return
            
        # self._status = ModelStatus.READY # uncomment when we actually implement loading
        self.set_error("GeoChat VQA model is not ready.")

    def preprocess_image(self, image_array: np.ndarray) -> Image.Image:
        """
        Convert numpy array to PIL Image and prepare for GeoChat.
        """
        image = Image.fromarray(image_array)
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image

    def predict(self, input_data: ModelInput) -> ModelOutput:
        if not self.is_loaded:
            return ModelOutput(
                success=False,
                status=ModelStatus.NOT_CONFIGURED if not self.is_configured else self.status,
                model=self.model_id,
                task="vqa",
                confidence=0.0,
                message="GeoChat VQA model is not ready.",
            )

        try:
            image = self.preprocess_image(input_data.images[0])
            query = input_data.query

            # ──────────────────────────────────────────────
            # GEOCHAT INFERENCE LOGIC (To be uncommented when model is ready)
            # ──────────────────────────────────────────────
            # inputs = self._processor(image, query, return_tensors="pt").to(self.device, self.dtype)
            # outputs = self._model.generate(**inputs)
            # answer = self._processor.decode(outputs[0], skip_special_tokens=True)
            #
            # return ModelOutput(
            #     success=True,
            #     status=ModelStatus.READY,
            #     model="GeoChat",
            #     task="vqa",
            #     confidence=0.85, 
            #     data={"answer": answer, "evidence": []},
            # )
            # ──────────────────────────────────────────────
            
            return ModelOutput(
                success=False,
                status=ModelStatus.ERROR,
                model="GeoChat",
                task="vqa",
                confidence=0.0,
                message="Inference not implemented yet (Waiting for download).",
            )
        except Exception as e:
             return ModelOutput(
                success=False,
                status=ModelStatus.ERROR,
                model="GeoChat",
                task="vqa",
                confidence=0.0,
                message=f"Inference error: {str(e)}",
            )

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "name": "GeoChat VQA",
            "task": "vqa",
            "modalities": ["SINGLE_IMAGE"],
            "description": "Visual Question Answering for remote-sensing imagery using GeoChat",
        }
