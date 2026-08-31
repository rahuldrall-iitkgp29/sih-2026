"""
SatQuery AI — Remote-Sensing Model Serving Service

This is the primary ML inference layer. It serves pretrained remote-sensing
models through a REST API consumed by the Node.js backend.

Architecture:
  FastAPI → Model Registry → Model Adapters → Pretrained Models
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.models.registry import model_registry
from app.routes import vqa, caption, grounding, change, change_vqa, optical_sar

# Worker identity
WORKER_ID = os.environ.get("WORKER_ID", "local-worker")
WORKER_NAME = os.environ.get("WORKER_NAME", "Local ML Worker")
GPU_INFO = os.environ.get("GPU_INFO", "Unknown GPU")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, cleanup on shutdown."""
    print(f"[*] Starting {WORKER_NAME} ({WORKER_ID})")
    print("[*] Loading remote-sensing models...")
    model_registry.load_all()
    print("[+] Model registry ready")
    model_registry.print_status()
    yield
    print("[*] Shutting down ML service")


app = FastAPI(
    title=f"SatQuery AI — ML Service ({WORKER_NAME})",
    description="Remote-Sensing Model Serving Service",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(vqa.router, prefix="/ml", tags=["VQA"])
app.include_router(caption.router, prefix="/ml", tags=["Caption"])
app.include_router(grounding.router, prefix="/ml", tags=["Grounding"])
app.include_router(change.router, prefix="/ml", tags=["Change Detection"])
app.include_router(change_vqa.router, prefix="/ml", tags=["Change VQA"])
app.include_router(optical_sar.router, prefix="/ml", tags=["Optical-SAR"])

def get_worker_meta():
    return {
        "id": WORKER_ID,
        "name": WORKER_NAME,
        "gpu": GPU_INFO,
        "status": "online"
    }

@app.get("/ml/health")
async def health():
    return {
        "status": "ok",
        "service": "SatQuery AI ML Service",
        "version": "1.0.0",
        "worker": get_worker_meta(),
        "models": model_registry.get_status_summary(),
    }


@app.get("/ml/models")
async def list_models():
    return {
        "worker": get_worker_meta(),
        "models": model_registry.get_all_metadata()
    }
