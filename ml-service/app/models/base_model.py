"""
Abstract base class for all remote-sensing models.

Every model adapter must implement this interface. This allows swapping
pretrained models without changing the API layer or the Node.js backend.

To add a new model:
1. Create a new file in app/models/ (e.g., my_vqa_model.py)
2. Subclass RemoteSensingModel
3. Implement load(), predict(), get_metadata()
4. Register it in app/models/registry.py
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import numpy as np


@dataclass
class ModelInput:
    """Standard input for model inference."""
    images: List[np.ndarray]  # List of images as numpy arrays (H, W, C)
    query: Optional[str] = None
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ModelOutput:
    """Standard output from model inference."""
    success: bool
    model: str
    task: str
    confidence: float
    data: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


class RemoteSensingModel(ABC):
    """Abstract base class for all remote-sensing model adapters."""

    def __init__(self, model_id: str = "", model_path: str = "", device: str = "cpu"):
        self.model_id = model_id
        self.model_path = model_path
        self.device = device
        self._loaded = False
        self._model = None

    @abstractmethod
    def load(self) -> None:
        """
        Load the model weights into memory.
        Should set self._loaded = True on success.
        """
        pass

    @abstractmethod
    def predict(self, input_data: ModelInput) -> ModelOutput:
        """
        Run inference on the input data.
        Returns a ModelOutput with results.
        """
        pass

    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """
        Return model metadata (name, version, task, etc.).
        """
        pass

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def is_configured(self) -> bool:
        """Whether this model has a model_id or model_path configured."""
        return bool(self.model_id) or bool(self.model_path)

    @property
    def status(self) -> str:
        if self._loaded:
            return "loaded"
        if self.is_configured:
            return "configured_not_loaded"
        return "not_configured"
