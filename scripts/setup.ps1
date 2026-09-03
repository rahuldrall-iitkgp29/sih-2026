<#
.SYNOPSIS
    One-Command Fresh-PC Setup & Deployment System for SatQuery (Windows).
    
.DESCRIPTION
    This script bootstraps a completely fresh Windows PC with the exact 
    SatQuery environment. It is fully idempotent (safe to run multiple times)
    and strictly follows a capability-based GPU detection mechanism.
#>

$ErrorActionPreference = "Stop"

function Write-Heading ($Title) {
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Cyan
}

function Write-Success ($Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Info ($Message) {
    Write-Host "[*] $Message" -ForegroundColor Yellow
}

function Write-ErrorBlock ($Message, $Action) {
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Red
    Write-Host "ERROR: $Message" -ForegroundColor Red
    Write-Host "====================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host $Action
    Write-Host ""
    Write-Host "Please fix the issue and run .\scripts\setup.ps1 again." -ForegroundColor Yellow
    Write-Host "====================================================" -ForegroundColor Red
    exit 1
}

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Heading "SATQUERY SETUP - GPU PREFLIGHT"

Write-Info "Checking for NVIDIA GPU and Driver via nvidia-smi..."
try {
    $nvidiaSmiOutput = nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
    if (-not $nvidiaSmiOutput) { throw }
    $gpuInfo = $nvidiaSmiOutput.Split(",")
    $gpuName = $gpuInfo[0].Trim()
    $gpuMemString = $gpuInfo[1].Trim()
    
    # Extract number (e.g. "8192 MiB" -> 8)
    $vramGB = [math]::Round([int]($gpuMemString -replace '[^\d]', '') / 1024)

    Write-Success "NVIDIA GPU Detected: $gpuName"
    Write-Success "VRAM Detected: $vramGB GB"

    if ($vramGB -lt 6) {
        Write-Info "WARNING: VRAM is less than 6GB. The current GeoChat 4-bit config requires at least 6GB. You may experience Out-Of-Memory errors."
    }
} catch {
    Write-ErrorBlock "NVIDIA GPU OR DRIVER NOT DETECTED" "SatQuery's GeoChat ML service requires an NVIDIA GPU and driver.`nnvidia-smi could not be executed.`n`n1. Install/Update the NVIDIA driver for your GPU.`n2. Reboot Windows.`n3. Verify 'nvidia-smi' works in PowerShell."
}

Write-Heading "SATQUERY SETUP - SYSTEM PREREQUISITES"

Write-Info "Checking Python..."
try {
    $pythonVer = (python --version 2>&1)
    Write-Success "Python Detected: $pythonVer"
} catch {
    Write-ErrorBlock "PYTHON NOT FOUND" "Python 3.10 is required but could not be found on PATH.`nInstall Python 3.10 and ensure it is added to your PATH."
}

Write-Info "Checking Node.js..."
try {
    $nodeVer = (node -v 2>&1)
    $npmVer = (npm -v 2>&1)
    Write-Success "Node.js Detected: $nodeVer (npm: $npmVer)"
} catch {
    Write-ErrorBlock "NODE.JS NOT FOUND" "Node.js is required but could not be found on PATH.`nInstall Node.js (v20 or higher) and ensure it is added to your PATH."
}

Write-Heading "SATQUERY SETUP - PYTHON VIRTUAL ENVIRONMENT"

$venvPath = Join-Path $ProjectRoot "ml-service\venv"
if (-not (Test-Path $venvPath)) {
    Write-Info "Creating Python virtual environment in ml-service\venv..."
    python -m venv $venvPath
    Write-Success "Virtual environment created."
} else {
    Write-Success "Virtual environment already exists."
}

Write-Info "Activating venv and installing dependencies..."
$pipPath = Join-Path $venvPath "Scripts\pip.exe"
$reqFile = Join-Path $ProjectRoot "scripts\requirements-win-cuda.txt"

# Install pinned dependencies (PyTorch CUDA wheels, Transformers, etc)
& $pipPath install -r $reqFile
if ($LASTEXITCODE -ne 0) {
    Write-ErrorBlock "DEPENDENCY INSTALLATION FAILED" "pip failed to install requirements from $reqFile"
}
Write-Success "Python dependencies (PyTorch, GeoChat, etc) installed successfully."

Write-Heading "SATQUERY SETUP - GEOCHAT MODEL DOWNLOAD"

$modelDir = Join-Path $ProjectRoot "ml-service\models\downloaded\vqa\geochat-7b"
$huggingfaceCli = Join-Path $venvPath "Scripts\huggingface-cli.exe"

if (-not (Test-Path (Join-Path $modelDir "config.json"))) {
    Write-Info "GeoChat model not found locally. Starting download (this is a multi-GB download and may take a while)..."
    Write-Info "The download is resumable. If it fails, just run this setup script again."
    
    # We use local-dir-use-symlinks False to ensure actual files are downloaded to Windows filesystem properly
    & $huggingfaceCli download MBZUAI/geochat-7B --local-dir $modelDir --local-dir-use-symlinks False
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorBlock "MODEL DOWNLOAD FAILED" "huggingface-cli failed to download MBZUAI/geochat-7B.`nIf a token is required, run '$huggingfaceCli login' first, then rerun setup."
    }
    Write-Success "GeoChat model downloaded and validated."
} else {
    Write-Success "GeoChat model already exists in $modelDir. Skipping download."
}

Write-Heading "SATQUERY SETUP - ENVIRONMENT VARIABLES"

function Setup-Env ($EnvExamplePath, $EnvPath, $ServiceName) {
    if (-not (Test-Path $EnvPath)) {
        if (Test-Path $EnvExamplePath) {
            Copy-Item -Path $EnvExamplePath -Destination $EnvPath
            Write-Success "Created $ServiceName .env from template."
        }
    } else {
        Write-Success "$ServiceName .env already exists. Preserving existing configuration."
    }
}

Setup-Env (Join-Path $ProjectRoot "ml-service\.env.example") (Join-Path $ProjectRoot "ml-service\.env") "ML Service"
Setup-Env (Join-Path $ProjectRoot "backend\.env.example") (Join-Path $ProjectRoot "backend\.env") "Backend"
# Frontend uses next.config.js which points to backend, but we can do it if .env.local exists.
# We'll just check if there is an example.
$feEnvExample = Join-Path $ProjectRoot "frontend\.env.example"
if (Test-Path $feEnvExample) {
    Setup-Env $feEnvExample (Join-Path $ProjectRoot "frontend\.env.local") "Frontend"
}


Write-Heading "SATQUERY SETUP - NODE DEPENDENCIES"

Write-Info "Installing Backend dependencies..."
Set-Location (Join-Path $ProjectRoot "backend")
if (Test-Path "package-lock.json") {
    npm ci
} else {
    npm install
}
Write-Success "Backend dependencies installed."

Write-Info "Installing Frontend dependencies..."
Set-Location (Join-Path $ProjectRoot "frontend")
if (Test-Path "package-lock.json") {
    npm ci
} else {
    npm install
}
Write-Success "Frontend dependencies installed."

Set-Location $ProjectRoot

Write-Heading "SATQUERY SETUP COMPLETE"
Write-Host "Setup finished successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run .\scripts\verify.ps1 to validate the system." -ForegroundColor Yellow
Write-Host "2. (Optional) Run .\scripts\verify-geochat.ps1 to test VRAM loading." -ForegroundColor Yellow
Write-Host "3. Run .\scripts\start.ps1 to start the application." -ForegroundColor Yellow
Write-Host ""
