# SatQuery AI — Remote-Sensing Model Serving Service

FastAPI-based model serving layer designed specifically for hosting and executing pretrained remote-sensing AI models.

## Key Architecture

- **Model Adapters (`app/models/`)**: Abstracted interface `RemoteSensingModel` implemented for each domain task (VQA, Captioning, Grounding, Change Detection, Change VQA, Optical-SAR Fusion).
- **FastAPI Endpoints (`app/routes/`)**: Standardized REST contracts with multipart/form-data support.
- **Model Registry (`app/models/registry.py`)**: Central registry for dynamic loading, lifecycle hooks, and health verification.

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ml/vqa` | Visual Question Answering for single remote-sensing image |
| `POST` | `/ml/caption` | Scene description & captioning for satellite imagery |
| `POST` | `/ml/grounding` | Natural language text-guided spatial grounding |
| `POST` | `/ml/change` | Bi-temporal change detection and area calculation |
| `POST` | `/ml/change-vqa` | Question answering on bi-temporal change pairs |
| `POST` | `/ml/optical-sar` | Cross-modal analysis on paired Optical and SAR imagery |
| `GET` | `/ml/models` | List all registered model adapters with status and metadata |
| `GET` | `/health` | Service health and active model statuses |

## Quickstart

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or on Windows: venv\Scripts\activate
   ```
2. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
