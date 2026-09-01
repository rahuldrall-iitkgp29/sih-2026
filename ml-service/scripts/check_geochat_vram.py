import sys
import os
import torch

def check_gpu():
    print("=== CUDA Diagnostics ===")
    if not torch.cuda.is_available():
        print("CUDA is NOT available.")
        sys.exit(1)
        
    gpu_id = torch.cuda.current_device()
    gpu_name = torch.cuda.get_device_name(gpu_id)
    total_memory = torch.cuda.get_device_properties(gpu_id).total_memory / (1024**3)
    
    print(f"GPU Name: {gpu_name}")
    print(f"Total VRAM: {total_memory:.2f} GB")
    
    allocated = torch.cuda.memory_allocated(gpu_id) / (1024**3)
    reserved = torch.cuda.memory_reserved(gpu_id) / (1024**3)
    free = total_memory - reserved
    print(f"Allocated VRAM: {allocated:.2f} GB")
    print(f"Reserved VRAM: {reserved:.2f} GB")
    print(f"Free VRAM: {free:.2f} GB")
    print("========================\n")
    return gpu_id

def load_geochat_and_check(gpu_id):
    print("=== Loading GeoChat (4-bit) ===")
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), '../GeoChat'))
        from geochat.model.builder import load_pretrained_model
        from geochat.mm_utils import get_model_name_from_path
        
        model_path = "/home/rahul/developement/projects/sih/ml-service/models/downloaded/vqa/geochat-7b"
        model_name = get_model_name_from_path(model_path)
        
        # Load in 4-bit
        tokenizer, model, image_processor, context_len = load_pretrained_model(
            model_path=model_path, 
            model_base=None, 
            model_name=model_name, 
            load_8bit=False, 
            load_4bit=True, 
            device="cuda"
        )
        print("Model Load Status: SUCCESS")
        
        peak_allocated = torch.cuda.max_memory_allocated(gpu_id) / (1024**3)
        peak_reserved = torch.cuda.max_memory_reserved(gpu_id) / (1024**3)
        
        print(f"Peak Allocated VRAM: {peak_allocated:.2f} GB")
        print(f"Peak Reserved VRAM: {peak_reserved:.2f} GB")
        print("===============================")
    except Exception as e:
        print(f"Model Load Status: FAILED ({e})")
        print("===============================")

if __name__ == "__main__":
    gpu_id = check_gpu()
    load_geochat_and_check(gpu_id)
