# SatQuery AI — Quickstart Guide

This guide will help you set up and run **SatQuery AI** in under 5 minutes for local development and demonstration.

---

## ⚡ Option A: Docker Compose (Easiest — 1 Command)

If you have **Docker Desktop** installed:

```bash
docker-compose up --build
```

This launches all 4 containers:
- **Frontend** → [http://localhost:3000](http://localhost:3000)
- **Backend API** → [http://localhost:5000](http://localhost:5000)
- **FastAPI ML Service** → [http://localhost:8000](http://localhost:8000)
- **MongoDB** → `localhost:27017`

---

## 💻 Option B: Local Development (Without Docker)

### Prerequisites
- **Node.js**: v18.0 or higher
- **Python**: v3.10 or higher
- *(Optional)* **MongoDB**: Running on port `27017`. (If MongoDB is not installed, the backend will automatically run in standalone in-memory mode without crashing).

---

### Step 1: Configure Environment Variables

1. **Backend Configuration:**
   Copy `backend/.env.example` to `backend/.env`:
   ```bash
   # Windows PowerShell:
   cp backend/.env.example backend/.env
   
   # Linux/macOS:
   cp backend/.env.example backend/.env
   ```
   Open `backend/.env` and optionally set your Gemini or OpenAI API key:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/satquery
   AI_PROVIDER=gemini
   AI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   PYTHON_ML_URL=http://localhost:8000
   ```

2. **ML Service Configuration:**
   Copy `ml-service/.env.example` to `ml-service/.env`:
   ```bash
   cp ml-service/.env.example ml-service/.env
   ```

---

### Step 2: Start the Python ML Service (Port 8000)

Open a new terminal:

```bash
cd ml-service

# 1. Create a virtual environment
python -m venv venv

# 2. Activate the virtual environment
# On Windows (PowerShell):
venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
venv\Scripts\activate.bat
# On macOS / Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
> Verify: Open [http://localhost:8000/health](http://localhost:8000/health) — should return `{"status": "ok"}`.

---

### Step 3: Start the Node.js Agentic Backend (Port 5000)

Open a second terminal:

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Start in development watch mode
### Step 2: Start the Servers

You can now start all three services (Frontend, Backend API, and ML Service) concurrently with a single command from the project root directory:

```bash
npm run dev
```

This will automatically launch:
- **Frontend** → [http://localhost:3000](http://localhost:3000)
- **Backend API** → [http://localhost:5000](http://localhost:5000)
- **FastAPI ML Service** → [http://localhost:8000](http://localhost:8000)

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🎯 Running the SIH Demo Scenarios

Once the frontend opens at [http://localhost:3000](http://localhost:3000):

1. Click **Launch Console** or go to `/dashboard`.
2. In the left panel under **Quick Demo Datasets**, click any demo button:
   - **Demo 1 (Single VQA)**: Automatically loads optical coastal port scene & runs visual question answering with bounding boxes.
   - **Demo 2 (Captioning)**: Automatically loads high-res optical scene & generates comprehensive land-cover percentage synopsis.
   - **Demo 3 (Bi-Temporal Change)**: Loads 2022 vs 2024 satellite pair & enables the interactive **Split-Screen Comparison Slider** with change delta metrics (+36% expansion).
   - **Demo 4 (Optical + SAR)**: Loads paired Sentinel-2 Optical and Sentinel-1 SAR imagery to identify specular water bodies and double-bounce urban structures.
3. Click the cyan **Analyze** button to execute the full Agentic routing pipeline and inspect the **Auditable Execution Trace**.

---

## 🛠️ Troubleshooting & FAQ

### Q1: What if MongoDB is not installed?
The backend handles database connection gracefully. If MongoDB is offline, analyses still run end-to-end, and the system continues operating for live demonstrations.

### Q2: What if I don't have an AI API key yet?
The application includes heuristic fallback classifications and synthetic demo mode. You can test all 4 remote-sensing workflows immediately even before adding your `.env` API key.

### Q3: How do I change the AI provider to OpenAI?
In `backend/.env`, set:
```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
```
Restart the backend (`npm run dev`). No frontend or agent code changes are required!

### Q4: Port 5000 or 8000 is already in use?
Change `PORT=5001` in `backend/.env` and update `NEXT_PUBLIC_API_URL=http://localhost:5001` in `frontend/.env.local`.

---

## 📑 Useful Links

- **Main Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Model Registry & Status**: [http://localhost:3000/models](http://localhost:3000/models)
- **Analysis History**: [http://localhost:3000/history](http://localhost:3000/history)
- **System Architecture**: [http://localhost:3000/about](http://localhost:3000/about)
- **FastAPI OpenAPI Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
