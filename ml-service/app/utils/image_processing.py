"""Image processing utilities for the ML service."""

import io
import numpy as np
from PIL import Image
from typing import Tuple, Optional


def load_image_from_bytes(image_bytes: bytes) -> np.ndarray:
    """Load an image from bytes into a numpy array (H, W, C)."""
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")
    return np.array(image)


def resize_image(image: np.ndarray, max_size: int = 1024) -> np.ndarray:
    """Resize image so the longest side is max_size, maintaining aspect ratio."""
    h, w = image.shape[:2]
    if max(h, w) <= max_size:
        return image
    scale = max_size / max(h, w)
    new_h, new_w = int(h * scale), int(w * scale)
    pil_img = Image.fromarray(image)
    pil_img = pil_img.resize((new_w, new_h), Image.LANCZOS)
    return np.array(pil_img)


def get_image_info(image: np.ndarray) -> dict:
    """Get basic image metadata."""
    return {
        "height": image.shape[0],
        "width": image.shape[1],
        "channels": image.shape[2] if len(image.shape) > 2 else 1,
        "dtype": str(image.dtype),
    }


def image_to_pil(image: np.ndarray) -> Image.Image:
    """Convert numpy array to PIL Image."""
    return Image.fromarray(image)


def normalize_image(image: np.ndarray) -> np.ndarray:
    """Normalize image to [0, 1] float32."""
    return image.astype(np.float32) / 255.0
