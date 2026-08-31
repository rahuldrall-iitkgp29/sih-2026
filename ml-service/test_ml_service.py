"""
Automated validation script for the SatQuery AI ML Service.
Tests model registry, routes, and image processing pipeline.
"""

import sys
import numpy as np

def test_components():
    print("==================================================")
    print("Testing SatQuery AI - ML Service Components")
    print("==================================================")

    # 1. Test image processing utils
    print("1. Testing image processing utilities...")
    from app.utils.image_processing import resize_image, normalize_image, get_image_info
    dummy_img = np.zeros((512, 512, 3), dtype=np.uint8)
    resized = resize_image(dummy_img, max_size=256)
    assert resized.shape[0] == 256 and resized.shape[1] == 256, "Resize failed"
    normalized = normalize_image(dummy_img)
    assert normalized.dtype == np.float32, "Normalization failed"
    info = get_image_info(dummy_img)
    assert info["height"] == 512, "Image info failed"
    print("   [PASSED] Image processing utilities passed.")

    # 2. Test Model Registry
    print("2. Testing Model Registry...")
    from app.models.registry import model_registry
    from app.models.base_model import ModelInput

    models = model_registry.get_all_metadata()
    assert len(models) == 6, f"Expected 6 models, found {len(models)}"
    print(f"   [PASSED] Registered {len(models)} specialist remote-sensing models:")
    for m in models:
        print(f"     - [{m['id']}] {m['name']} (Task: {m['task']}, Status: {m['status']})")

    # 3. Test Model Adapter Invocations (Graceful unconfigured handling)
    print("3. Testing Model Adapter Execution...")
    vqa_model = model_registry.get("rs-vqa")
    assert vqa_model is not None
    vqa_out = vqa_model.predict(ModelInput(images=[dummy_img], query="test"))
    assert vqa_out.task == "VQA"
    print("   [PASSED] VQA adapter returned expected contract.")

    change_model = model_registry.get("change-detection")
    assert change_model is not None
    change_out = change_model.predict(ModelInput(images=[dummy_img, dummy_img]))
    assert change_out.task == "CHANGE_ANALYSIS"
    print("   [PASSED] Change detection adapter returned expected contract.")

    fusion_model = model_registry.get("optical-sar-fusion")
    assert fusion_model is not None
    fusion_out = fusion_model.predict(ModelInput(images=[dummy_img, dummy_img]))
    assert fusion_out.task == "OPTICAL_SAR_ANALYSIS"
    print("   [PASSED] Optical-SAR fusion adapter returned expected contract.")

    # 4. Test FastAPI App Initialization & OpenAPI Schema
    print("4. Testing FastAPI Application & Routes...")
    from app.main import app
    openapi_schema = app.openapi()
    paths = list(openapi_schema.get("paths", {}).keys())

    expected_routes = [
        "/health",
        "/ml/models",
        "/ml/vqa",
        "/ml/caption",
        "/ml/grounding",
        "/ml/change",
        "/ml/change-vqa",
        "/ml/optical-sar",
    ]
    for route in expected_routes:
        assert route in paths, f"Missing expected route in OpenAPI schema: {route}"
    print(f"   [PASSED] All {len(expected_routes)} FastAPI endpoints registered cleanly: {sorted(paths)}")

    print("==================================================")
    print("SUCCESS: ML Service Validation Succeeded (0 Errors)!")
    print("==================================================")

if __name__ == "__main__":
    try:
        test_components()
    except Exception as e:
        print(f"ERROR: Validation failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
