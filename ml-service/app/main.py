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

from app.models.registry import model_registry
from app.routes import vqa, caption, grounding, change, change_vqa, optical_sar


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, cleanup on shutdown."""
    print("[*] Loading remote-sensing models...")
    model_registry.load_all()
    print("[+] Model registry ready")
    model_registry.print_status()
    yield
    print("[*] Shutting down ML service")


app = FastAPI(
    title="SatQuery AI — ML Service",
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


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "SatQuery AI ML Service",
        "version": "1.0.0",
        "models": model_registry.get_status_summary(),
    }


@app.get("/ml/models")
async def list_models():
    return {"models": model_registry.get_all_metadata()}
