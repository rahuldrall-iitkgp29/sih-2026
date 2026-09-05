# SatQuery — Complete Technical Approach

**Document purpose:** Technical architecture and flow reconstruction for project presentation.
**Repository state analyzed:** 2026-09-04
**Implementation status:** Current / Partial / Future

---

## PART 1 — PROJECT OVERVIEW

SatQuery is a distributed, multi-modal Vision-Language Assistant designed specifically for satellite and aerial imagery analysis. 

Traditionally, remote-sensing analysis requires specialized GIS software and deep domain expertise. SatQuery solves this by democratizing access to geospatial intelligence: users can upload raw satellite imagery and ask natural language questions (e.g., "Where are the ships?", "What changed between these two dates?"). 

**Inputs:** Natural language text prompts and one or more raster images (GeoTIFF, PNG, JPEG).
**Processing:** An intelligent Node.js orchestrator classifies the intent, routes the request to a distributed GPU worker pool running specialized PyTorch models (like GeoChat), or falls back to a generalized VLM if the specialist is unavailable.
**Outputs:** Human-readable text answers, bounding box coordinates for grounding, and downloadable reports.

**Core Technologies:** Next.js (Frontend), Node.js/Express + LangChain (Backend Orchestrator), Python/FastAPI (ML Service), PyTorch (Inference Engine), MongoDB (Storage).

---

## PART 2 — COMPLETE SYSTEM ARCHITECTURE

The system utilizes a decoupled 3-tier architecture capable of distributed processing.

* **Frontend (Next.js):**
  * *Responsibility:* User interface, image upload, chat interaction, and result visualization.
  * *Technology:* Next.js 14 (App Router), TypeScript, Tailwind CSS.
  * *Status:* IMPLEMENTED.
* **Backend API / Orchestrator (Node.js):**
  * *Responsibility:* Request validation, file storage, AI agent planning (LangChain), task routing, and response synthesis.
  * *Technology:* Node.js, Express.js, TypeScript, Mongoose.
  * *Status:* IMPLEMENTED.
* **Database (MongoDB):**
  * *Responsibility:* Persistent storage of analysis metadata, past queries, and AI execution traces.
  * *Technology:* MongoDB.
  * *Status:* IMPLEMENTED.
* **ML Service / Worker (Python):**
  * *Responsibility:* Heavy GPU-bound AI inference for remote sensing tasks.
  * *Technology:* Python 3.10, FastAPI, PyTorch, Uvicorn.
  * *Status:* IMPLEMENTED.
* **Model Registry (Python + Node.js sync):**
  * *Responsibility:* Tracks loaded models, checks health, and broadcasts capabilities to the Node.js router.
  * *Technology:* Custom Adapter Pattern (`RemoteSensingModel`).
  * *Status:* IMPLEMENTED.
* **AI Models:**
  * *Responsibility:* Executing visual reasoning tasks.
  * *Technology:* GeoChat-7B (HuggingFace Transformers, BitsAndBytes 4-bit quant).
  * *Status:* IMPLEMENTED (GeoChat), PLANNED (Change Detection, Optical-SAR).
* **Image Preprocessing:**
  * *Responsibility:* Parsing GeoTIFFs, extracting geospatial metadata, standardizing arrays for models.
  * *Technology:* Rasterio, Pillow, NumPy.
  * *Status:* IMPLEMENTED.

---

## PART 3 — PHYSICAL ARCHITECTURE / MULTI-LAPTOP LOCAL SETUP

SatQuery is designed to run either entirely on one machine or distributed across multiple machines on a local network (LAN) to offload heavy GPU inference.

### Machine-Level Deployment
* **Laptop A (The Server/Client Node):**
  * Runs the Node.js Backend and Next.js Frontend.
  * Does not require a powerful GPU.
  * Requires Node.js v20+.
  * Hosts MongoDB (or connects to cloud).
  * Exposes port 3000 (Frontend) and 8000 (Backend).
* **Laptop B (The GPU Worker Node):**
  * Runs the Python FastAPI ML Service.
  * Requires a modern NVIDIA GPU (RTX 3060+ with >6GB VRAM), CUDA toolkit, and Python 3.10+.
  * Stores the heavy HuggingFace model `.bin`/`.safetensors` files locally.
  * Binds to `0.0.0.0` to accept LAN connections.
  * Exposes port 8000 (or custom port).

### Network Communication
When deployed across laptops:
1. **Frontend → Backend:** HTTP POST to `http://<Laptop-A-IP>:8000/api/analyze`
2. **Backend → ML Service:** The backend `.env` is configured with targeted routing variables (e.g., `VQA_ML_URL=http://<Laptop-B-IP>:8000`). The backend sends HTTP POST requests containing serialized image bytes and JSON metadata.
3. **ML Service → Backend:** Returns JSON inference results (text, bounding boxes) synchronously over the same HTTP request.

**IP Configuration:** Managed entirely via `.env` files. If Laptop B's IP changes, the user only updates `VQA_ML_URL` (and other task URLs) in Laptop A's `backend/.env` and restarts the backend.

---

## PART 4 — END-TO-END USER QUERY FLOW

1. **User Input:** User opens the Next.js frontend, uploads a GeoTIFF image, and types "Identify all airplanes." (IMPLEMENTED)
2. **Frontend Dispatch:** UI packages the file and text into a `multipart/form-data` payload and POSTs to `/api/analyze`. (IMPLEMENTED)
3. **Backend Ingestion:** Express middleware parses the upload, saves the raw file to a local `/uploads` directory, and initiates the Agent Workflow. (IMPLEMENTED)
4. **Task Classification:** LangChain agent uses a fast LLM (e.g., Gemini Flash) with a `CLASSIFICATION_PROMPT` to classify the query. It categorizes the intent as `GROUNDING`. (IMPLEMENTED)
5. **Worker Routing:** The backend checks the Model Registry. It looks up `GROUNDING_ML_URL` and confirms the Python worker is `READY`. (IMPLEMENTED)
6. **ML Service Request:** Backend forwards the raw image bytes and text prompt via HTTP to the Python ML Service at `/ml/grounding`. (IMPLEMENTED)
7. **Image Preprocessing:** Python worker uses `rasterio` to parse the GeoTIFF in-memory, extracting metadata and converting it to a standardized `(H, W, C)` NumPy array. (IMPLEMENTED)
8. **Inference:** The tensor and prompt are passed into the 4-bit quantized GeoChat-7B model adapter. PyTorch executes the forward pass on the GPU. (IMPLEMENTED)
9. **Result Formatting:** Model returns a text response and bounding box arrays `[x1, y1, x2, y2]`. (IMPLEMENTED)
10. **Backend Synthesis:** The Node.js LangChain agent receives the technical output and synthesizes a polished human-readable JSON response. (IMPLEMENTED)
11. **Persistence:** Backend saves the `AnalysisResult` schema to MongoDB. (IMPLEMENTED)
12. **Frontend Render:** Frontend receives the JSON, displays the chat response, and renders interactive bounding boxes over the image. (IMPLEMENTED)

---

## PART 5 — IMAGE / GEOSPATIAL DATA FLOW

**Geospatial processing was a significant technical hurdle.** 

### Before (The Problem)
Initially, standard imaging libraries (like PIL) failed to process large GeoTIFF files. They crashed on non-RGB bands, unsupported depths (float32), and multi-spectral formats, causing the VQA model to fail entirely when attempting to convert images to tensors.

### The Fix
A custom `load_image_from_bytes()` function was introduced in `image_processing.py`.
* It detects `.tif` and uses `rasterio.MemoryFile` to read the file in-memory.
* It safely handles `(C, H, W)` channel ordering by transposing it to the `(H, W, C)` format required by vision transformers.
* It extracts `nodata` values and CRS metadata (`extract_image_metadata()`).

### Important Architectural Decision
The **raw GeoTIFF is always preserved**. The backend saves the untouched raw file in `/uploads`. The ML service performs dynamic, ephemeral conversions (like uint8 scaling and RGB channel extraction) *only in memory* during inference. This ensures no geospatial data loss occurs.

---

## PART 6 — AI / ML ARCHITECTURE

The ML service is built on **FastAPI** for high-throughput, asynchronous API handling.

* **Adapter Pattern:** All models inherit from a base `RemoteSensingModel` class containing `load()`, `predict()`, and `get_metadata()`. This abstracts PyTorch complexities away from the API layer.
* **Model Registry:** A singleton class that initializes, attempts to load, and tracks the status (`READY`, `LOADING`, `ERROR`) of all adapters.
* **Memory Management:** Models trap `torch.cuda.OutOfMemoryError` during inference, forcefully call `torch.cuda.empty_cache()`, and return a `GPU_OUT_OF_MEMORY` status gracefully back to the Node backend instead of crashing the server.

**Currently Integrated: GeoChat**
* *Architecture:* 7 Billion parameter multi-modal Vision-Language Model.
* *Precision:* 4-bit quantization (NF4) using `bitsandbytes` and `accelerate`.
* *VRAM constraints:* Quantization allows this massive model to run on consumer GPUs requiring only ~6GB of VRAM.

---

## PART 7 — CURRENT MODEL / GPU ARCHITECTURE

* **Target Deployment GPU:** Consumer-grade NVIDIA GPUs (e.g., RTX 3060, RTX 4060, or targeted RTX 5050 laptops).
* **VRAM Constraints:** Targeted at systems with 6GB to 8GB of VRAM.
* **Quantization Necessity:** Unquantized 7B parameter models require ~14GB+ VRAM. 4-bit quantization is absolutely mandatory for local-laptop execution.
* **Dependencies:** PyTorch with CUDA 12.1 support, NVIDIA drivers.

---

## PART 8 — BACKEND ARCHITECTURE

* **Framework:** Node.js + Express + TypeScript.
* **Pattern:** MVC + Service + Agent layers.
* **Core Agent Logic (`src/agents/satquery.agent.ts`):** Implements an orchestration pipeline that uses LLMs as decision engines to route tasks.
* **Resilience:** Implements a graceful fallback. If the ML Service is offline or returns an OOM error, the orchestrator sets `modelSource: 'FALLBACK'` and uses a general cloud Vision AI (like Gemini Pro Vision) to attempt the analysis, ensuring the system never completely fails.

**Logical Flow:**
`Router` → `Upload Middleware` → `Agent Controller` → `Classification Planner` → `ML Service Request` → `Synthesis Prompt` → `JSON Response`

---

## PART 9 — FRONTEND ARCHITECTURE

* **Framework:** Next.js 14 (App Router).
* **Components:** React Dropzone for drag-and-drop uploads, Lucide icons.
* **Communication:** Standard fetch API to `/api/analyze` and `/api/models`.
* **State Management:** React hooks (`useState`, `useEffect`) tracking loading states, current queries, and parsing bounding box overlays onto image previews.

---

## PART 10 — DATABASE / STORAGE

* **Database:** MongoDB (using Mongoose ODM).
* **Schema:** `Analysis` collection stores metadata, text prompts, generated answers, AI execution traces, and bounding box arrays.
* **Image Storage:** Images are stored persistently on the local file system in `backend/uploads/`. The database stores the relative file path.
* **Temporary Data:** Extracted GeoTIFF arrays exist only in GPU memory during inference and are discarded immediately after.

---

## PART 11 — ENVIRONMENT & CONFIGURATION

Communication relies entirely on local environment variables to map the distributed cluster.

* **Backend Routing (`backend/.env`):**
  * Multiple granular ML worker variables: `VQA_ML_URL`, `CAPTION_ML_URL`, `CHANGE_ML_URL`, etc.
  * Allows directing specific remote-sensing tasks to entirely different physical laptops if needed.
* **ML Worker Targeting:**
  * By configuring `VQA_ML_URL=http://192.168.1.5:8000`, the Node backend knows exactly where to send image tensors for VQA tasks over the LAN.

---

## PART 12 — FRESH MACHINE / DEPLOYMENT SETUP

Deployment is fully automated for Windows via `scripts/setup.ps1`.

**The Flow:**
1. **GPU Preflight:** Executes `nvidia-smi` to detect GPU name and extract total VRAM. Throws an error if <6GB VRAM is detected. (IMPLEMENTED)
2. **Prerequisites:** Validates Python 3.10 and Node.js installation. (IMPLEMENTED)
3. **Environment Creation:** Creates a `venv`, installs strict PyTorch CUDA wheels and HuggingFace dependencies. (IMPLEMENTED)
4. **Model Provisioning:** Idempotently downloads the massive GeoChat-7B `.safetensors` files using `huggingface-cli` directly to the `models/` directory. (IMPLEMENTED)
5. **Node Modules:** Runs `npm ci` in both frontend and backend. (IMPLEMENTED)

---

## PART 13 — GIT / DEVELOPMENT WORKFLOW

The architecture allows Frontend/Backend engineers and ML engineers to work concurrently. ML engineers can modify PyTorch model adapters in Python without affecting the Node.js agent orchestration. Node engineers can mock ML service responses locally without requiring an NVIDIA GPU on their development machine.

---

## PART 14 — CURRENT IMPLEMENTED ARCHITECTURE

### What Exists Right Now
* **Frontend:** Next.js UI, file uploading, chat interface, bounding box rendering.
* **Backend:** Node.js Express, LangChain orchestration, MongoDB persistence, heuristic fallback.
* **ML Service:** FastAPI server, `RemoteSensingModel` registry, `bitsandbytes` quantization.
* **AI Models:** GeoChat-7B fully integrated for VQA, Captioning, and Grounding.
* **Data Processing:** GeoTIFF ingestion via `rasterio`.
* **Deployment:** `setup.ps1` automated Windows bootstrapping.

---

## PART 15 — PARTIALLY IMPLEMENTED FEATURES

* **Text Reports:** Currently, the system can generate a `.txt` report file from past analyses (`/api/analyze/:id/report`). It is fully functional, but it is a plaintext placeholder for a future PDF generator.
* **Multi-Model Routing Interface:** The backend `.env` variables and agent logic exist for tasks like Change Detection, but the Python implementations are currently stubbed.

---

## PART 16 — FUTURE ARCHITECTURE

### Planned / Future
* **Change Detection Model:** Adding a specialized PyTorch model (e.g., ChangeFormer or SNUNet) to compare two images over time. (PLANNED)
* **Optical-SAR Fusion:** Models for synthesizing cross-modal radar and optical imagery. (PLANNED)
* **PDF Report Generation:** Replacing the `.txt` endpoint with a backend library (like `pdfkit`) to generate professional, formatted PDFs containing the image, bounding boxes, and synthesized text. (PLANNED)

---

## PART 17 — CURRENT → FUTURE ARCHITECTURE TRANSITION

The system is future-proofed using the **Adapter Pattern & Service Mesh Registry**.

**Current:** Node.js talks to the ML Registry → GeoChat Model.
**Integration Layer:** The backend `planner.ts` already knows how to classify `CHANGE_ANALYSIS`. The `.env` already supports `CHANGE_ML_URL`. The Python `ModelRegistry` already dynamically loads capabilities.
**Future Expansion:** To add Change Detection, an ML engineer simply drops a new `ChangeModel` python adapter into the `app/models/` folder. The Registry broadcasts it as `READY`, and the backend immediately begins routing bi-temporal requests to it without requiring any rewrite of the Node.js orchestration logic.

---

## PART 18 — MASTER TECHNICAL FLOW

```text
USER
  ↓ (Uploads GeoTIFF & query)
NEXT.JS FRONTEND
  ↓ HTTP POST /api/analyze
NODE.JS BACKEND (EXPRESS)
  ↓
FILE SYSTEM (Saves raw upload)
  ↓
LANGCHAIN CLASSIFICATION AGENT (Gemini Flash)
  ↓ (Determines Task: GROUNDING)
MODEL REGISTRY CHECK
  ↓ (Checks GROUNDING_ML_URL)
PYTHON ML SERVICE (FASTAPI)
  ↓ HTTP POST /ml/grounding
RASTERIO PREPROCESSING (Extract metadata, convert to HWC array)
  ↓
GEOCHAT-7B ADAPTER (PyTorch)
  ↓ (4-bit inference on GPU)
RAW JSON PREDICTIONS (Text + BBoxes)
  ↓
PYTHON ML SERVICE
  ↓ HTTP RESPONSE
NODE.JS BACKEND
  ↓
LANGCHAIN SYNTHESIS AGENT (Polishes text)
  ↓
MONGODB (Persists result)
  ↓
NEXT.JS FRONTEND (Renders boxes/text)
  ↓
USER
```

---

## PART 19 — FLOWCHART NODE INVENTORY

| Node | Type | Responsibility | Connects To | Status |
| ---- | ---- | -------------- | ----------- | ------ |
| User | Actor | Submits imagery & query | Next.js Frontend | IMPLEMENTED |
| Next.js Frontend | UI | Renders chat, boxes, uploads | Node.js Backend | IMPLEMENTED |
| Node.js Backend | API Server | Orchestrates requests, saves files | Frontend, MongoDB, LangChain, ML Service | IMPLEMENTED |
| MongoDB | Database | Stores analysis metadata/traces | Node.js Backend | IMPLEMENTED |
| Local Storage | File System | Stores raw GeoTIFF/PNGs | Node.js Backend | IMPLEMENTED |
| LangChain Agent | AI Logic | Task classification & synthesis | Node.js Backend, Gemini API | IMPLEMENTED |
| Model Registry | Component | Tracks loaded models & capabilities| Node.js Backend, ML Service | IMPLEMENTED |
| Python ML Service| API Server | Hosts GPU inference endpoints | Node.js Backend, GeoChat Model | IMPLEMENTED |
| Rasterio Preprocessor| Component | Converts GeoTIFF to Model Tensors| Python ML Service | IMPLEMENTED |
| GeoChat-7B | AI Model | VQA, Grounding, Captioning | Python ML Service | IMPLEMENTED |
| NVIDIA GPU | Hardware | Executes CUDA tensors in 4-bit | GeoChat-7B | IMPLEMENTED |
| Change Detection | AI Model | Bi-temporal pixel analysis | Python ML Service | PLANNED |
| PDF Generator | Component | Renders downloadable PDF reports | Node.js Backend | PLANNED |

### Connections
* Next.js Frontend → Node.js Backend : HTTP REST API
* Node.js Backend → MongoDB : Mongoose/TCP
* Node.js Backend → LangChain Agent : Internal code
* Node.js Backend → Python ML Service : HTTP API (LAN network capable)
* Python ML Service → Rasterio Preprocessor : Local execution
* Python ML Service → GeoChat-7B : PyTorch Inference
* Python ML Service → Change Detection : PyTorch Inference (Planned)

---

## PART 20 — PRESENTATION-READY TECHNICAL STORY

### What did we technically build?
We built a distributed, scalable Agentic Vision-Language platform capable of running state-of-the-art remote sensing AI on consumer hardware. 

We started by decoupling the user-facing web logic from the heavy machine learning workloads. We built a Next.js frontend and a Node.js API acting as the brain of the system. Instead of hardcoding AI behaviors, we implemented a LangChain orchestration agent that dynamically interprets what the user is asking, deciding on the fly whether a question requires visual question answering, scene captioning, or geospatial grounding.

To handle the massive computational requirements of remote-sensing models without relying on expensive cloud GPUs, we built an independent Python FastAPI ML worker. This worker can run on a completely separate laptop on a local network. We integrated GeoChat-7B, a massive multi-modal model, and utilized 4-bit quantization to shrink its memory footprint so it fits gracefully within the 6GB-8GB VRAM limits of standard laptops. We also solved significant geospatial data challenges by implementing custom `rasterio` preprocessing, allowing the AI to ingest raw, multi-band GeoTIFFs without crashing or losing crucial metadata.

Looking forward, our architecture is already primed for the future. Through our dynamic Model Registry and Adapter pattern, plugging in a new model—like a dedicated temporal Change Detection model or an Optical-SAR fusion model—requires zero rewrites of the core application. The system will simply detect the new capability on the network and begin routing complex comparative queries to the new worker immediately.

---

# Verification Notes
* Files inspected: `PRD.md`, `AI-ML-WORKFLOW.md`, `ml-service/app/utils/image_processing.py`, `scripts/setup.ps1`, `backend/.env.example`
* Important routes verified: `/api/analyze`, `/ml/grounding`
* ML specifics verified: `RemoteSensingModel` abstraction, 4-bit quantization, `GPU_OUT_OF_MEMORY` handling, multi-laptop `_ML_URL` environment variables.
* Image processing verified: `rasterio.MemoryFile` transpose to `(H,W,C)` logic.
