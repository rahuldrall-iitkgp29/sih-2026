Write-Host "Starting SatQuery AI Project..." -ForegroundColor Green

# 1. Start AI ML-Service
Write-Host "Launching ML Service (Port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml-service; .\venv\Scripts\activate; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal

# 2. Start Backend
Write-Host "Launching Backend (Node)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

# 3. Start Frontend
Write-Host "Launching Frontend (Next.js Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "All services launched in separate windows!" -ForegroundColor Green
