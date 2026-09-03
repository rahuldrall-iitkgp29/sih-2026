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
                device=self.device, device_map={"": 0}
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
                import traceback; traceback.print_exc(); self.set_error(f"GeoChat VQA model load error: {e}")

    def preprocess_image(self, image_array: np.ndarray, metadata: dict = None) -> Image.Image:
        """
        Convert numpy array to a PIL Image (RGB 8-bit) appropriate for GeoChat.
        Handles multi-spectral band selection, nodata masking, and robust percentile normalization.
        """
        metadata = metadata or {}
        colorinterp = metadata.get("colorinterp", [])
        nodata = metadata.get("nodata", None)
        
        # 1. Handle NoData, NaN, Inf
        # If float type, handle NaNs and Infs
        if np.issubdtype(image_array.dtype, np.floating):
            valid_mask = np.isfinite(image_array)
        else:
            valid_mask = np.ones(image_array.shape, dtype=bool)
            
        if nodata is not None:
            valid_mask &= (image_array != nodata)
            
        # 2. Band Selection
        channels = image_array.shape[-1] if image_array.ndim == 3 else 1
        if image_array.ndim == 2:
            image_array = np.expand_dims(image_array, axis=-1)
            channels = 1
            
        if channels == 1:
            # Replicate grayscale to RGB. 
            # Note: This is a visualization representation for GeoChat.
            img_rgb = np.concatenate([image_array]*3, axis=-1)
            valid_mask = np.concatenate([valid_mask]*3, axis=-1)
        elif channels >= 3:
            # Attempt to find explicit RGB bands from rasterio colorinterp
            r_idx, g_idx, b_idx = 0, 1, 2  # Fallback to first 3
            if 'red' in colorinterp and 'green' in colorinterp and 'blue' in colorinterp:
                r_idx = colorinterp.index('red')
                g_idx = colorinterp.index('green')
                b_idx = colorinterp.index('blue')
            
            img_rgb = image_array[:, :, [r_idx, g_idx, b_idx]]
            if valid_mask.ndim == 3 and valid_mask.shape[-1] == channels:
                valid_mask = valid_mask[:, :, [r_idx, g_idx, b_idx]]
        else:
            # 2-channel images (e.g., VV/VH SAR)
            # Note: For VQA/GeoChat, we use the first channel as a grayscale representation.
            # This discards the second channel and is a visualization fallback, not a true VV/VH fusion.
            img_rgb = np.concatenate([image_array[:, :, :1]]*3, axis=-1)
            if valid_mask.ndim == 3:
                valid_mask = np.concatenate([valid_mask[:, :, :1]]*3, axis=-1)

        # 3. Normalization
        if img_rgb.dtype == np.uint8:
            # Preserve existing behavior for already-valid uint8 RGB images.
            # Just ensure NoData pixels are black.
            img_rgb = img_rgb.copy()
            if valid_mask.ndim == 3:
                img_rgb[~valid_mask] = 0
            else:
                img_rgb[~valid_mask, :] = 0
        else:
            # Robust Percentile Normalization for float/uint16
            img_rgb_float = img_rgb.astype(np.float32)
            normalized_rgb = np.zeros_like(img_rgb_float, dtype=np.uint8)
            
            for c in range(3):
                band = img_rgb_float[:, :, c]
                mask = valid_mask[:, :, c] if valid_mask.ndim == 3 else valid_mask
                valid_pixels = band[mask]
                
                if valid_pixels.size > 0:
                    # 2nd and 98th percentile to ignore extreme outliers / sensor anomalies
                    p2, p98 = np.percentile(valid_pixels, (2, 98))
                    if p98 > p2:
                        # Clip and scale
                        band_clipped = np.clip(band, p2, p98)
                        band_scaled = ((band_clipped - p2) / (p98 - p2) * 255.0)
                    else:
                        # Constant value image
                        band_scaled = np.zeros_like(band)
                else:
                    band_scaled = np.zeros_like(band)
                    
                # Apply NoData masking (turn invalid pixels to 0/black)
                band_scaled[~mask] = 0
                normalized_rgb[:, :, c] = band_scaled.astype(np.uint8)
            
            img_rgb = normalized_rgb

        return Image.fromarray(img_rgb, mode="RGB")

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
            
            image = self.preprocess_image(
                input_data.images[0], 
                metadata=input_data.parameters.get("image_metadata", {})
            )
            query = input_data.query

            chat_state = conv_templates['llava_v1'].copy()
            img_list = []
            
            # Setup image
            self.chat.upload_img(image, chat_state, img_list)
            # Setup prompt
            self.chat.ask(query, chat_state)
            
            if len(img_list) > 0 and not isinstance(img_list[0], torch.Tensor):
                self.chat.encode_img(img_list)

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



