# SatQuery AI — Agentic Vision-Language Assistant for Remote Sensing

> **Smart India Hackathon (SIH 2026) — Internal Round Working Prototype**
> An extensible, multi-modal remote-sensing intelligence system capable of single-image visual question answering, scene captioning, spatial region grounding, bi-temporal change detection, and Optical + SAR cross-modal fusion.

---

## 🛰️ 1. Architecture Overview

SatQuery AI is built on a **3-tier decoupled architecture**:

```
                    SATQUERY AI
                         │
                         ▼
                ┌─────────────────┐
                │ Next.js 14      │
                │ React/Tailwind  │
                └────────┬────────┘
                         │ REST / Multipart
                         ▼
                ┌─────────────────┐
                │ Node.js Express │
                │ LangChain Agent │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Model / Tool    │
                │ Registry        │
                └────────┬────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
     ┌─────────────────┐   ┌─────────────────┐
     │ Python FastAPI  │   │ General AI API  │
     │ ML Service      │   │ Gemini / OpenAI │
     │ (Specialist RS) │   │ (Reason+Fallback)│
     └────────┬────────┘   └─────────────────┘
              │
      ┌───────┼────────┬──────────┐
      ▼       ▼        ▼          ▼
   RS-VQA  Caption   Change   Optical-SAR
   Model    Model    Model       Model
```

### Transparent Fallback Hierarchy

```
User Query
    ↓
Specialist Remote-Sensing Model (FastAPI ML Service)
    ↓ (if unconfigured / unavailable)
General Vision AI Provider (Gemini / OpenAI)
    ↓ (if unconfigured)
Clear Graceful Error Notice
```

---

## ⚡ 2. Core Workflows

### 1. Single Image Analysis
- **Visual Question Answering (VQA)**: Deep-dive infrastructure, settlement, and land cover Q&A.
- **Scene Captioning**: Automated remote-sensing structural summaries.
- **Region Grounding**: Natural-language guided bounding box detection.

### 2. Bi-Temporal Change Detection
- **Split-Slider Viewer**: Compare T1 and T2 satellite captures with an interactive split line.
- **Delta Calculation**: Area percentage increase/decrease metrics.
- **Change VQA**: Answering questions specifically regarding temporal discrepancies.

### 3. Optical + SAR Cross-Modal Fusion
- **Synergistic Analysis**: Combines Optical RGB reflectance with Synthetic Aperture Radar (SAR) microwave backscatter.
- **Specular Water Identification**: Sharp water body boundary extraction regardless of cloud cover.
- **Built-Up Double-Bounce**: Accurate structural density mapping.

---

## 🛠️ 3. Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, React Dropzone.
- **Backend Orchestrator**: Node.js, Express, TypeScript, LangChain, Zod, Multer, Mongoose, Sharp, Pino.
- **Model Serving Layer**: Python 3.11, FastAPI, Uvicorn, NumPy, Pillow, Pydantic.
- **Database**: MongoDB (optional / graceful fallback for standalone demos).

---

## 📁 4. Project Structure

```
satquery-ai/
├── frontend/                     # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/                  # Pages: /, /dashboard, /history, /models, /about
│   │   ├── components/           # ImageUploader, ImageViewer, QueryPanel, ResultPanel, Trace
│   │   ├── data/                 # Preloaded synthetic remote-sensing demo scenarios
│   │   ├── lib/                  # Axios client & helpers
│   │   └── types/                # Shared TypeScript definitions
│   └── package.json
│
├── backend/                      # Node.js + LangChain Agentic Server
│   ├── src/
│   │   ├── agents/               # Planner, Router, SatQuery Agent, Execution State
│   │   ├── config/               # Zod-validated environment config & MongoDB
│   │   ├── controllers/          # Upload & Analysis endpoints
│   │   ├── models/               # Model Registry & AI Provider Abstraction (Gemini/OpenAI)
│   │   ├── routes/               # Express API routes (/api/upload, /api/analyze, /api/models)
│   │   ├── services/             # Analysis & Report generation
│   │   ├── tools/                # LangChain tool implementations
│   │   └── server.ts
│   └── package.json
│
├── ml-service/                   # FastAPI Remote-Sensing Model Serving Service
│   ├── app/
│   │   ├── models/               # RemoteSensingModel base adapter & model wrappers
│   │   ├── routes/               # REST endpoints (/ml/vqa, /ml/caption, /ml/change, etc.)
│   │   └── main.py
│   ├── training/bigearthnet/     # BigEarthNet dataset loader & fine-tuning scaffolds
│   └── requirements.txt
│
├── sample-data/                  # Demo dataset documentation
├── docker-compose.yml            # Multi-service deployment config
└── README.md
```

---

## 🚀 5. Quickstart & Local Setup

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- (Optional) MongoDB running at `localhost:27017`

### Step 1: Clone and Configure Environment

```bash
# In backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/satquery
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key_here
PYTHON_ML_URL=http://localhost:8000

# In ml-service/.env
ML_PORT=8000
```

### Step 2: Run the Python ML Service

```bash
cd ml-service
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Step 3: Run the Node.js Backend

```bash
cd backend
npm install
npm run dev
```

### Step 4: Run the Next.js Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 6. Testing & Demo Scenarios

In the Dashboard, click **Quick Demo Datasets** to instantly run test scenarios:

1. **Demo 1: Single Image VQA**
   - Query: *"Describe the land-cover and major objects visible in this image."*
   - Detects coastal port, runways, and urban grid with bounding box evidence.
2. **Demo 2: Single Image Captioning**
   - Query: *"Describe this image."*
   - Produces structured scene summary with percentage composition.
3. **Demo 3: Bi-Temporal Change Analysis**
   - Query: *"What changed between these two dates, and where did the change occur?"*
   - Compares 2022 vs 2024 imagery with interactive split slider and delta metrics (+36% expansion).
4. **Demo 4: Optical + SAR Fusion**
   - Query: *"Use the optical and SAR images together to identify built-up and water-covered regions."*
   - Fuses optical reflectance with microwave backscatter.

---

## 🔌 7. Model Plug-In Guide (Zero-Code-Change)

To integrate a new pretrained remote-sensing model:

1. In `ml-service/app/models/vqa_model.py`, subclass `RemoteSensingModel`:
```python
class VQAModel(RemoteSensingModel):
    def load(self):
        self._model = AutoModelForVisualQuestionAnswering.from_pretrained(self.model_id)
        self._loaded = True

    def predict(self, input_data):
        # Run inference and return ModelOutput
        ...
```
2. Configure `VQA_MODEL_ID=your-huggingface-model` in `backend/.env` or `ml-service/.env`.
3. Restart the ML service. The Node.js LangChain agent automatically detects it via the Model Registry!

---

## ⏱️ 8. Timeout Configuration

Since AI/ML model inference on satellite imagery can be time-intensive, timeout limits are configured across the full stack to prevent premature request failures:

| Layer | Component | Timeout | File |
|-------|-----------|---------|------|
| **Frontend** | Axios API Client (all requests) | **5 min (300s)** | `frontend/src/lib/api.ts` |
| **Backend → ML** | VQA Specialist Model | **4 min (240s)** | `backend/src/tools/vqa.tool.ts` |
| **Backend → ML** | Caption Specialist Model | **4 min (240s)** | `backend/src/tools/caption.tool.ts` |
| **Backend → ML** | Grounding Specialist Model | **4 min (240s)** | `backend/src/tools/grounding.tool.ts` |
| **Backend → ML** | Change VQA Model | **4 min (240s)** | `backend/src/tools/changeVqa.tool.ts` |
| **Backend → ML** | Change Detection Model | **4 min (240s)** | `backend/src/tools/change.tool.ts` |
| **Backend → ML** | Optical-SAR Fusion Model | **4 min (240s)** | `backend/src/tools/opticalSar.tool.ts` |
| **Backend** | Model Registry Status Refresh | **10s** | `backend/src/models/model.registry.ts` |
| **Backend** | ML Service Health Check | **5s** | `backend/src/routes/health.routes.ts` |

> **Note:** The frontend timeout (300s) is intentionally greater than backend tool timeouts (240s) so the browser never drops the connection before the backend finishes processing.

---

## 🔮 9. MVP vs. Post-MVP Scope

| Feature | Status in MVP |
|---|---|
| Full Next.js 3-Panel Workspace | ✅ Fully Implemented |
| Agentic LangChain Task Classification | ✅ Fully Implemented |
| FastAPI RS Model Serving Layer & Registry | ✅ Fully Implemented |
| Transparent Fallback (Specialist vs AI) | ✅ Fully Implemented |
| Auditable Execution Trace & Report Generator | ✅ Fully Implemented |
| Preloaded Synthetic Demo Datasets | ✅ Fully Implemented |
| BigEarthNet Fine-Tuning Pipeline | 🔮 Architecture Scaffolding Prepared |
| Advanced Optical-SAR Sub-Pixel Registration | 🔮 Planned Post-MVP |

---

## 💻 10. Fresh PC Deployment (Production / Secondary Machine)

SatQuery AI includes a fully automated, **GPU-capability based deployment system** designed to bootstrap a fresh Windows PC effortlessly. 

### Development vs Deployment Hardware

This deployment system preserves the known-good development environment while dynamically supporting newer NVIDIA hardware.

| Component | Development Environment (Validated) | Deployment Target (Validated) |
| :--- | :--- | :--- |
| **OS** | Windows | Windows |
| **GPU** | NVIDIA GeForce RTX 3050 | **NVIDIA GeForce RTX 5050** |
| **VRAM** | 6 GB | 8 GB |
| **PyTorch** | 2.5.1+cu121 | 2.5.1+cu121 |
| **GeoChat** | 7B (4-bit configuration) | 7B (4-bit configuration) |

*Note: The current GeoChat 4-bit configuration has been validated on GPUs with at least 6GB VRAM. The setup script will warn you if less than 6GB is detected, but will not strictly prevent installation.*

### Deployment Instructions

On your fresh Windows PC, ensure you have:
1. **NVIDIA Driver** installed for your specific GPU.
2. **Git**, **Python 3.10**, and **Node.js 24** installed.

Then, open PowerShell as an Administrator (to bypass execution policies if necessary) and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# 1. Run the idempotent setup bootstrap
# This creates the venv, installs strict PyTorch CUDA wheels, downloads GeoChat, and runs npm ci.
.\scripts\setup.ps1

# 2. Verify System Health & Python Dependencies
.\scripts\verify.ps1

# 3. (CRITICAL) Run the GeoChat Smoke Test
# This explicitly loads the model into your GPU's VRAM and runs a test inference to prove RTX 5050 capability.
.\scripts\verify-geochat.ps1

# 4. Start the Application
# Replaces start_project.ps1 with a robust, dynamically-pathed multi-window launcher.
.\scripts\start.ps1
```

> **Important**: Do not install the system-level CUDA Toolkit unless you explicitly need `nvcc`. The `.\scripts\setup.ps1` script strictly installs PyTorch wheels that bundle the required CUDA 12.1 runtime automatically.
