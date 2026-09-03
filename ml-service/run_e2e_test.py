import os
import sys
import time
# pyrefly: ignore [missing-import]
import rasterio
from fastapi.testclient import TestClient

# Adjust path to find app
sys.path.append(os.path.dirname(__file__))

from app.main import app

client = TestClient(app)

def test_image(filepath, query):
    print(f"\n==============================================")
    print(f"Testing File: {filepath}")
    
    # 1. Print Image Properties
    try:
        if filepath.endswith(('.tif', '.tiff')):
            with rasterio.open(filepath) as dataset:
                print(f"TIFF Dimensions: {dataset.width}x{dataset.height}")
                print(f"Number of bands: {dataset.count}")
                print(f"Dtype: {dataset.meta['dtype']}")
                print(f"ColorInterp: {[c.name for c in dataset.colorinterp]}")
                print(f"NoData: {dataset.nodata}")
        else:
            print("JPEG/PNG Image")
    except Exception as e:
        print(f"Error reading properties: {e}")

    # 2. Test API Route
    print(f"--- Sending to /ml/vqa API ---")
    start_time = time.time()
    try:
        with open(filepath, "rb") as f:
            response = client.post(
                "/ml/vqa",
                files={"image": (os.path.basename(filepath), f, "image/tiff" if filepath.endswith('.tif') else "image/jpeg")},
                data={"query": query}
            )
        end_time = time.time()
        print(f"Inference Time: {end_time - start_time:.2f} seconds")
        print(f"HTTP Status: {response.status_code}")
        
        resp_json = response.json()
        print(f"API Response:")
        for k, v in resp_json.items():
            print(f"  {k}: {v}")
            
    except Exception as e:
        print(f"API Request Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    from app.models.registry import model_registry
    model = model_registry.get("rs-vqa")
    if model:
        print("Loading VQA Model...")
        model.load()
        print(f"Model status: {model.status}")
    else:
        print("Model not found in registry")

    tif_path = r"C:\Users\iitkg\OneDrive\Documents\sih\backend\uploads\80c151f2-7780-4d73-b9d8-47f114d6faf2.tif"
    jpg_path = r"C:\Users\iitkg\OneDrive\Documents\sih\backend\uploads\5a1db13c-c91a-49d2-ac2e-93c23d2e27b8.jpg"
    
    query = "What do you see in this satellite image?"
    
    if os.path.exists(tif_path):
        test_image(tif_path, query)
    else:
        print(f"TIFF not found at {tif_path}")
        
    if os.path.exists(jpg_path):
        test_image(jpg_path, query)
    else:
        print(f"JPG not found at {jpg_path}")
