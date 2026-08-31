# SatQuery AI — Remote-Sensing ML Service

This service provides the Machine Learning backend for SatQuery AI. It acts as an **ML Worker**, designed to run on local NVIDIA laptops (or servers) and serve pretrained remote-sensing specialist models via FastAPI to the Node.js centralized backend.

## Architecture

```text
Node + LangChain
      ↓
ML Worker Registry
      ↓
One or more local FastAPI workers
      ↓
NVIDIA GPU
      ↓
Pretrained RS model
```

## Setup & Execution

### 1. Single-Machine Setup (Default)
If you want to run everything on one machine, simply set `PYTHON_ML_URL=http://localhost:8000` in the Node backend's `.env`, and start this service locally.

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the worker
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Multi-Laptop Setup (Distributed ML Workers)
You can distribute different specialist models across multiple laptops (e.g., Laptop A runs VQA, Laptop B runs Change Detection). 

1. Start a worker on Laptop A (e.g., IP: `192.168.1.10`)
   ```bash
   WORKER_ID="vqa-worker" WORKER_NAME="VQA Laptop" uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```
2. Start a worker on Laptop B (e.g., IP: `192.168.1.11`)
   ```bash
   WORKER_ID="change-worker" WORKER_NAME="Change Laptop" uvicorn app.main:app --host 0.0.0.0 --port 8002
   ```
3. Update your **Node.js Backend `.env`** to point to these specific workers:
   ```env
   VQA_ML_URL=http://192.168.1.10:8001
   CHANGE_ML_URL=http://192.168.1.11:8002
   ```

## Model Integration Guide

To integrate a new pretrained remote-sensing model, follow these steps:

1. **Install dependencies**: Add any model-specific dependencies to `requirements.txt` (e.g., `transformers`, `torch`, `timm`).
2. **Download model**: Place model checkpoints in a local directory or note the HuggingFace ID.
3. **Configure ID/Path**: Add the `MODEL_ID` or `MODEL_PATH` in `backend/.env` (which passes them or requires ML worker `.env` mirroring). The Python ML service reads `app.config` to find `model_id` and `model_path`.
4. **Implement Adapter**: Edit the relevant file in `app/models/` (e.g., `vqa_model.py`). Implement the `load()` and `predict()` methods of the `RemoteSensingModel` base class.
5. **Register Model**: `app/models/registry.py` already registers the models, ensure the names match.
6. **Start Worker**: Start FastAPI. The model will load on startup or lazily based on config.
7. **Verify endpoint**: Test `GET /ml/models` to verify the model shows as `READY`.
8. **Test via Node**: Trigger a request from the Next.js frontend and verify the Node.js LangChain agent uses the specialist model.

## Model Lifecycle States
Models report standard states: `NOT_CONFIGURED`, `LOADING`, `READY`, `BUSY`, `ERROR`, `OFFLINE`.
If a GPU error occurs (e.g., OOM), the state will change to `ERROR` and `GPU_OUT_OF_MEMORY` will be reported to Node.js for a graceful fallback to Vision AI.


## GeoChat VQA Integration

### 1. Model location
GeoChat should be placed in `ml-service/models/downloaded/`. (e.g. `ml-service/models/downloaded/GeoChat`)

### 2. Required dependencies
The model requires `torch`, `transformers`, `torchvision`, and optionally `flash-attn`.

### 3. Environment variables
Configure the `.env` file in the ML worker:
```env
VQA_MODEL_ID=geochat
VQA_MODEL_PATH=./models/downloaded/GeoChat
VQA_DEVICE=cuda
VQA_DTYPE=float16
```

### 4. GPU configuration
The model requires an NVIDIA GPU for optimal inference. CUDA is used if `VQA_DEVICE=cuda`.

### 5. Model loading
The adapter inside `app/models/vqa_model.py` will load the processor and weights using Transformers once the download is complete and the path is valid.

### 6. FastAPI endpoint
The route is available at `POST /ml/vqa` and accepts `image` and `query` via `multipart/form-data`.

### 7. Example request
```bash
curl -X POST http://localhost:8000/ml/vqa \
  -F "image=@sample.tif" \
  -F "query=What is the land cover?"
```

### 8. Example response
```json
{
  "success": true,
  "task": "vqa",
  "status": "completed",
  "model": "GeoChat",
  "answer": "The image shows a dense urban residential area.",
  "confidence": 0.85,
  "evidence": [],
  "metadata": {}
}
```

### 9. Troubleshooting
- `MODEL_NOT_CONFIGURED`: Check `.env` paths.
- `LOADING` or `ERROR`: Check FastAPI console logs for missing dependencies or model file issues.
- `GPU_OUT_OF_MEMORY`: Reduce batch size or switch to `float16`.

### 10. VRAM considerations
GeoChat is a large VLM. It typically requires ~16GB VRAM in fp16. If you have less, try 8-bit quantization (`load_in_8bit=True`).
