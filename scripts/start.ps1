<#
.SYNOPSIS
    Start script for SatQuery AI Project (Windows).
    
.DESCRIPTION
    This script replaces start_project.ps1 by dynamically discovering the
    repository root and launching the ML Service, Backend, and Frontend
    in separate PowerShell windows.
#>

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "STARTING SATQUERY AI PROJECT" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Start AI ML-Service
Write-Host "[1/3] Launching ML Service (Port 8000)..." -ForegroundColor Yellow
$mlCommand = "cd '$ProjectRoot\ml-service'; .\venv\Scripts\activate; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $mlCommand -WindowStyle Normal

# 2. Start Backend
Write-Host "[2/3] Launching Backend (Node Port 5000)..." -ForegroundColor Yellow
$backendCommand = "cd '$ProjectRoot\backend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -WindowStyle Normal

# 3. Start Frontend
Write-Host "[3/3] Launching Frontend (Next.js Port 3000)..." -ForegroundColor Yellow
$frontendCommand = "cd '$ProjectRoot\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand -WindowStyle Normal

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "SATQUERY LAUNCHED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Frontend : http://localhost:3000" -ForegroundColor White
Write-Host "Backend  : http://localhost:5000" -ForegroundColor White
Write-Host "ML       : http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Please wait 1-2 minutes for the GeoChat model to load into VRAM." -ForegroundColor Yellow
Write-Host "Check the ML Service window for the 'Model registry ready' message." -ForegroundColor Yellow
Write-Host ""
