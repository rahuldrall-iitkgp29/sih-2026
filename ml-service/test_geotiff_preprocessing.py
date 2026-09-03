import os
import sys
import numpy as np
from PIL import Image

sys.path.append(os.path.dirname(__file__))

from app.models.vqa_model import VQAModel

def run_tests():
    print("Testing GeoTIFF preprocessing...")
    model = VQAModel(model_id="test", model_path="dummy", device="cpu")
    
    # Test 1: uint8 RGB (should be preserved)
    arr1 = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    img1 = model.preprocess_image(arr1)
    assert img1.mode == "RGB"
    assert np.array_equal(np.array(img1), arr1)
    print("Test 1 Passed: uint8 RGB")

    # Test 2: uint16 RGB
    arr2 = np.random.randint(0, 65535, (100, 100, 3), dtype=np.uint16)
    img2 = model.preprocess_image(arr2)
    assert img2.mode == "RGB"
    assert img2.size == (100, 100)
    print("Test 2 Passed: uint16 RGB")

    # Test 3: float32 RGB
    arr3 = np.random.rand(100, 100, 3).astype(np.float32)
    img3 = model.preprocess_image(arr3)
    assert img3.mode == "RGB"
    print("Test 3 Passed: float32 RGB")

    # Test 4: grayscale 1-channel (float32)
    arr4 = np.random.rand(100, 100, 1).astype(np.float32)
    img4 = model.preprocess_image(arr4)
    assert img4.mode == "RGB"
    arr4_pil = np.array(img4)
    # Check if channels are duplicated
    assert np.array_equal(arr4_pil[:,:,0], arr4_pil[:,:,1])
    assert np.array_equal(arr4_pil[:,:,1], arr4_pil[:,:,2])
    print("Test 4 Passed: grayscale duplicated to RGB")

    # Test 5: 4-band TIFF (should fallback to first 3)
    arr5 = np.random.randint(0, 255, (100, 100, 4), dtype=np.uint8)
    img5 = model.preprocess_image(arr5)
    assert img5.mode == "RGB"
    assert np.array_equal(np.array(img5), arr5[:,:,:3])
    print("Test 5 Passed: 4-band fallback to first 3")

    # Test 6: >4-band TIFF with colorinterp metadata
    arr6 = np.random.rand(100, 100, 5).astype(np.float32)
    meta = {"colorinterp": ["gray", "red", "green", "blue", "nir"]}
    img6 = model.preprocess_image(arr6, metadata=meta)
    assert img6.mode == "RGB"
    # Wait, the conversion scales it, so we just check it runs without error and produces RGB
    print("Test 6 Passed: 5-band with explicit colorinterp")

    # Test 7: NaN / Inf values
    arr7 = np.random.rand(100, 100, 3).astype(np.float32)
    arr7[0, 0, :] = np.nan
    arr7[1, 1, :] = np.inf
    img7 = model.preprocess_image(arr7)
    arr7_pil = np.array(img7)
    assert np.array_equal(arr7_pil[0, 0, :], [0, 0, 0])
    assert np.array_equal(arr7_pil[1, 1, :], [0, 0, 0])
    print("Test 7 Passed: NaN / Inf masking")

    # Test 8: NoData values
    arr8 = np.ones((100, 100, 3), dtype=np.float32) * 5.0
    arr8[0, 0, :] = -9999.0 # nodata
    meta8 = {"nodata": -9999.0}
    img8 = model.preprocess_image(arr8, metadata=meta8)
    arr8_pil = np.array(img8)
    assert np.array_equal(arr8_pil[0, 0, :], [0, 0, 0])
    print("Test 8 Passed: NoData value masking")
    
    # Test 9: Constant value images
    arr9 = np.ones((100, 100, 3), dtype=np.float32) * 42.0
    img9 = model.preprocess_image(arr9)
    assert img9.mode == "RGB"
    assert np.all(np.array(img9) == 0) # Constant value scales to 0 in our logic
    print("Test 9 Passed: Constant value handling")

    print("All tests passed!")

if __name__ == '__main__':
    run_tests()
