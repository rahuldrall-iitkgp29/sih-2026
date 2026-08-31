"""Configuration for the ML service, read from environment variables."""

import os
from dataclasses import dataclass, field


@dataclass
class ModelConfig:
    """Configuration for a single model."""
    model_id: str = ""
    model_path: str = ""
    device: str = "cpu"


@dataclass
class Config:
    """Global ML service configuration."""
    host: str = field(default_factory=lambda: os.getenv("ML_HOST", "0.0.0.0"))
    port: int = field(default_factory=lambda: int(os.getenv("ML_PORT", "8000")))
    device: str = field(default_factory=lambda: os.getenv("ML_DEVICE", "cpu"))
    models_dir: str = field(default_factory=lambda: os.getenv("MODELS_DIR", "./models/downloaded"))

    # Specialist model configs
    vqa: ModelConfig = field(default_factory=lambda: ModelConfig(
        model_id=os.getenv("VQA_MODEL_ID", ""),
        model_path=os.getenv("VQA_MODEL_PATH", ""),
    ))
    caption: ModelConfig = field(default_factory=lambda: ModelConfig(
        model_id=os.getenv("CAPTION_MODEL_ID", ""),
        model_path=os.getenv("CAPTION_MODEL_PATH", ""),
    ))
    grounding: ModelConfig = field(default_factory=lambda: ModelConfig(
        model_id=os.getenv("GROUNDING_MODEL_ID", ""),
        model_path=os.getenv("GROUNDING_MODEL_PATH", ""),
    ))
    change: ModelConfig = field(default_factory=lambda: ModelConfig(
        model_id=os.getenv("CHANGE_MODEL_ID", ""),
        model_path=os.getenv("CHANGE_MODEL_PATH", ""),
    ))
    change_vqa: ModelConfig = field(default_factory=lambda: ModelConfig(
        model_id=os.getenv("CHANGE_VQA_MODEL_ID", ""),
        model_path=os.getenv("CHANGE_VQA_MODEL_PATH", ""),
    ))
    optical_sar: ModelConfig = field(default_factory=lambda: ModelConfig(
        model_id=os.getenv("OPTICAL_SAR_MODEL_ID", ""),
        model_path=os.getenv("OPTICAL_SAR_MODEL_PATH", ""),
    ))


config = Config()
