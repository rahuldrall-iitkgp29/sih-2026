"""
Model Registry — manages all remote-sensing model adapters.

Loads and tracks the status of each specialist model.
The Node.js backend queries this registry via GET /ml/models.
"""

from typing import Dict, List, Any, Optional
from app.models.base_model import RemoteSensingModel
from app.models.vqa_model import VQAModel
from app.models.caption_model import CaptionModel
from app.models.grounding_model import GroundingModel
from app.models.change_model import ChangeModel
from app.models.change_vqa_model import ChangeVQAModel
from app.models.optical_sar_model import OpticalSARModel
from app.config import config


class ModelRegistry:
    """Central registry for all remote-sensing model adapters."""

    def __init__(self):
        self._models: Dict[str, RemoteSensingModel] = {}
        self._initialize()

    def _initialize(self):
        """Register all model adapters."""
        self._models = {
            "rs-vqa": VQAModel(
                model_id=config.vqa.model_id,
                model_path=config.vqa.model_path,
                device=config.device,
            ),
            "rs-caption": CaptionModel(
                model_id=config.caption.model_id,
                model_path=config.caption.model_path,
                device=config.device,
            ),
            "rs-grounding": GroundingModel(
                model_id=config.grounding.model_id,
                model_path=config.grounding.model_path,
                device=config.device,
            ),
            "change-detection": ChangeModel(
                model_id=config.change.model_id,
                model_path=config.change.model_path,
                device=config.device,
            ),
            "change-vqa": ChangeVQAModel(
                model_id=config.change_vqa.model_id,
                model_path=config.change_vqa.model_path,
                device=config.device,
            ),
            "optical-sar-fusion": OpticalSARModel(
                model_id=config.optical_sar.model_id,
                model_path=config.optical_sar.model_path,
                device=config.device,
            ),
        }

    def load_all(self):
        """Attempt to load all configured models."""
        for model_id, model in self._models.items():
            if model.is_configured:
                try:
                    print(f"  Loading {model_id}...")
                    model.load()
                    print(f"  [+] {model_id} loaded successfully")
                except Exception as e:
                    print(f"  [!] {model_id} failed to load: {e}")
            else:
                print(f"  [-] {model_id} not configured (skipped)")

    def get(self, model_id: str) -> Optional[RemoteSensingModel]:
        return self._models.get(model_id)

    def get_all_metadata(self) -> List[Dict[str, Any]]:
        """Return metadata for all models (used by GET /ml/models)."""
        result = []
        for model_id, model in self._models.items():
            meta = model.get_metadata()
            meta["id"] = model_id
            meta["status"] = model.status
            meta["model_id"] = model.model_id
            result.append(meta)
        return result

    def get_status_summary(self) -> Dict[str, str]:
        return {mid: m.status for mid, m in self._models.items()}

    def print_status(self):
        print("\n--- Model Registry Status ---")
        for mid, m in self._models.items():
            icon = "[LOADED]" if m.is_loaded else ("[CONFIGURED]" if m.is_configured else "[UNCONFIGURED]")
            print(f"  {icon} {mid}: {m.status}")
        print("-----------------------------\n")


# Singleton
model_registry = ModelRegistry()
