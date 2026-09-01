import os
import sys
import torch
import numpy as np
from PIL import Image
from typing import Any, Dict
from app.models.base_model import RemoteSensingModel, ModelInput, ModelOutput, ModelStatus

class VQAModel(RemoteSensingModel):
    """Adapter for the GeoChat VQA model."""

    def __init__(self, model_id: str, model_path: str, device: str):
        super().__init__(model_id, model_path, device)
        self.chat = None
        self.dtype = os.getenv("VQA_DTYPE", "4bit")
        
        # Inject GeoChat into sys.path
        geochat_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'GeoChat')
        if geochat_dir not in sys.path:
            sys.path.append(geochat_dir)

    def load(self) -> None:
        if not self.is_configured:
            return

        print(f"  [VQA] Preparing GeoChat VQA model adapter for ID: {self.model_id}, Path: {self.model_path}")
        
        if self.model_path and not os.path.exists(os.path.join(self.model_path, "config.json")):
            self.set_error("GeoChat VQA model checkpoint not found.")
            return

        self._status = ModelStatus.LOADING
        
        try:
            from geochat.conversation import conv_templates, Chat
            from geochat.model.builder import load_pretrained_model
            from geochat.mm_utils import get_model_name_from_path

            model_name = get_model_name_from_path(self.model_path)
            
            load_8bit = self.dtype == "8bit"
            load_4bit = self.dtype == "4bit"
            
            tokenizer, model, image_processor, context_len = load_pretrained_model(
                self.model_path, 
                None, 
                model_name, 
                load_8bit, 
                load_4bit, 
                device=self.device
            )
            
            model.eval()
            self.chat = Chat(model, image_processor, tokenizer, device=self.device)
            self._status = ModelStatus.READY
            
        except Exception as e:
            if "out of memory" in str(e).lower() or "cublas_status" in str(e).lower():
                self.set_error("GPU_OUT_OF_MEMORY")
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            else:
                self.set_error(f"GeoChat VQA model load error: {e}")

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
                status=self.status,
                model="GeoChat",
                task="vqa",
                confidence=None,
                message="GeoChat VQA model is not ready.",
            )

        try:
            from geochat.conversation import conv_templates
            
            image = self.preprocess_image(input_data.images[0])
            query = input_data.query

            chat_state = conv_templates['llava_v1'].copy()
            img_list = []
            
            # Setup image
            self.chat.upload_img(image, chat_state, img_list)
            # Setup prompt
            self.chat.ask(query, chat_state)
            
            # Run inference
            with torch.inference_mode():
                streamer = self.chat.stream_answer(
                    conv=chat_state, 
                    img_list=img_list, 
                    temperature=0.1, 
                    max_new_tokens=300, 
                    max_length=2000
                )
            
            answer = ""
            for new_output in streamer:
                answer += new_output
                
            return ModelOutput(
                success=True,
                status=ModelStatus.READY,
                model="GeoChat",
                task="vqa",
                confidence=None,
                data={"answer": answer, "evidence": []},
            )
            
        except torch.cuda.OutOfMemoryError:
            torch.cuda.empty_cache()
            return ModelOutput(
                success=False,
                status="GPU_OUT_OF_MEMORY",
                model="GeoChat",
                task="vqa",
                confidence=None,
                message="GeoChat could not be loaded on the configured GPU due to OOM during inference.",
            )
        except Exception as e:
            return ModelOutput(
                success=False,
                status=ModelStatus.ERROR,
                model="GeoChat",
                task="vqa",
                confidence=None,
                message=f"Inference error: {str(e)}",
            )

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "name": "GeoChat VQA",
            "model": "GeoChat",
            "task": "vqa",
            "tasks": ["vqa", "caption", "grounding"],
            "modalities": ["SINGLE_IMAGE"],
            "description": "Visual Question Answering for remote-sensing imagery using GeoChat",
            "status": self.status,
            "device": self.device
        }
