import os
import sys
import numpy as np
from PIL import Image

# Ensure test uses 4bit by default
os.environ['VQA_DTYPE'] = '4bit'

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.models.registry import model_registry
from app.models.base_model import ModelInput

def create_dummy_image():
    # Create a simple RGB numpy image
    img = np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8)
    return img

if __name__ == '__main__':
    print('[*] Loading Model Registry...')
    model = model_registry.get('rs-vqa')
    
    if not model:
        print('[-] rs-vqa model not found in registry')
        sys.exit(1)
        
    print(f'[*] Initializing model... (device={model.device}, dtype={model.dtype})')
    model.load()
    
    if not model.is_loaded:
        print(f'[-] Model failed to load. Status: {model.status}')
        sys.exit(1)
        
    print('[+] Model loaded successfully.')
    
    # Run test
    print('[*] Creating dummy test image (512x512)...')
    img_array = create_dummy_image()
    
    query = 'What objects are visible in this image?'
    print(f'[*] Query: {query}')
    
    input_data = ModelInput(images=[img_array], query=query)
    
    import time
    start_time = time.time()
    
    print('[*] Running inference...')
    result = model.predict(input_data)
    
    end_time = time.time()
    
    print('\n--- RESULT ---')
    print(f'Success: {result.success}')
    print(f'Status: {result.status}')
    if result.success:
        print(f'Answer: {result.data.get("answer", "")}')
    else:
        print(f'Message: {result.message}')
    print(f'Time taken: {end_time - start_time:.2f} seconds')
    print('--------------')
