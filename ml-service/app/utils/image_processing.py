import io
import numpy as np
from PIL import Image
import rasterio

def load_image_from_bytes(image_bytes: bytes, filename: str = "image.jpg") -> np.ndarray:
    """
    Load an image from bytes, supporting standard formats (JPEG, PNG) 
    and GeoTIFF/TIFF formats via Rasterio.
    """
    is_tiff = filename.lower().endswith(('.tif', '.tiff', '.geotiff'))

    if is_tiff:
        try:
            # Use rasterio MemoryFile for in-memory reading
            with rasterio.MemoryFile(image_bytes) as memfile:
                with memfile.open() as dataset:
                    # Read all bands
                    img_array = dataset.read()
                    
                    # Convert to (H, W, C) format expected by most models
                    if img_array.ndim == 3:
                        # rasterio reads as (C, H, W)
                        img_array = np.transpose(img_array, (1, 2, 0))
                    
                    return img_array
        except Exception as e:
            print(f"Rasterio failed to load TIFF: {e}")
            raise ValueError(f"Failed to load TIFF image: {e}")
    else:
        # Standard PIL loading for JPG/PNG
        try:
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != "RGB":
                image = image.convert("RGB")
            return np.array(image)
        except Exception as e:
            raise ValueError(f"Failed to load standard image: {e}")

def validate_image_pair(image1_bytes: bytes, image2_bytes: bytes, filename1: str, filename2: str):
    """
    Validates that a pair of images (e.g. for change detection or optical-SAR fusion)
    have compatible dimensions. Optionally validates CRS if both are GeoTIFF.
    """
    img1 = load_image_from_bytes(image1_bytes, filename1)
    img2 = load_image_from_bytes(image2_bytes, filename2)

    # Check dimensions (H, W)
    if img1.shape[:2] != img2.shape[:2]:
        raise ValueError(f"Image dimensions do not match. Image 1: {img1.shape[:2]}, Image 2: {img2.shape[:2]}")
    
    return img1, img2
