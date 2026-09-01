import sys
import os
import torch
from PIL import Image

sys.path.append(os.path.join(os.path.dirname(__file__), '../GeoChat'))
from geochat.conversation import conv_templates, Chat
from geochat.model.builder import load_pretrained_model
from geochat.mm_utils import get_model_name_from_path

def test():
    model_path = "/home/rahul/developement/projects/sih/ml-service/models/downloaded/vqa/geochat-7b"
    print("Loading GeoChat (4-bit)...")
    
    model_name = get_model_name_from_path(model_path)
    
    tokenizer, model, image_processor, context_len = load_pretrained_model(
        model_path=model_path, 
        model_base=None, 
        model_name=model_name, 
        load_8bit=False, 
        load_4bit=True, 
        device="cuda"
    )
    
    device = "cuda"
    model.eval()
    
    chat = Chat(model, image_processor, tokenizer, device=device)
    
    # We will use a real remote-sensing image from sample-data/
    # If not present, we will fallback to a dummy image
    image_path = "/home/rahul/developement/projects/sih/sample-data/test.tif"
    if os.path.exists(image_path):
        print(f"Using image: {image_path}")
        image = Image.open(image_path).convert('RGB')
    else:
        # Check sample-data for any images
        sample_dir = "/home/rahul/developement/projects/sih/sample-data/"
        images = [f for f in os.listdir(sample_dir) if f.endswith(('.jpg', '.png', '.tif', '.jpeg'))] if os.path.exists(sample_dir) else []
        if images:
            image_path = os.path.join(sample_dir, images[0])
            print(f"Using image: {image_path}")
            image = Image.open(image_path).convert('RGB')
        else:
            print("No real image found in sample-data, using dummy image for testing load.")
            import numpy as np
            image = Image.fromarray(np.zeros((300, 300, 3), dtype=np.uint8))
            
    chat_state = conv_templates['llava_v1'].copy()
    img_list = []
    
    chat.upload_img(image, chat_state, img_list)
    query = "What objects are visible in this image?"
    print(f"Query: {query}")
    chat.ask(query, chat_state)
    
    print("Generating answer...")
    streamer = chat.stream_answer(conv=chat_state, img_list=img_list, temperature=0.1, max_new_tokens=100, max_length=2000)
    
    output = ""
    for new_output in streamer:
        output += new_output
    
    print("\nAnswer:", output)

if __name__ == "__main__":
    test()
