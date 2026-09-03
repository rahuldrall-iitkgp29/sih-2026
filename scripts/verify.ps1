<#
.SYNOPSIS
    Lightweight diagnostic script to verify the Fresh-PC Setup.
#>

$ErrorActionPreference = "Stop"

function Write-Heading ($Title) {
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Cyan
}

function Write-Result ($Key, $Value, $IsError = $false) {
    if ($IsError) {
        Write-Host "$Key`:`n$Value" -ForegroundColor Red
    } else {
        Write-Host "$Key`:`n$Value" -ForegroundColor Green
    }
    Write-Host ""
}

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Heading "SATQUERY SYSTEM CHECK"

# System
Write-Host "SYSTEM" -ForegroundColor Yellow
$osInfo = Get-CimInstance Win32_OperatingSystem
Write-Result "OS" $osInfo.Caption
$cpuInfo = Get-CimInstance Win32_Processor
Write-Result "CPU" $cpuInfo.Name

$ramGB = [math]::Round($osInfo.TotalVisibleMemorySize / 1024 / 1024)
Write-Result "RAM" "$ramGB GB"

# GPU
Write-Host "GPU" -ForegroundColor Yellow
try {
    $nvidiaSmiOutput = nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
    $gpuInfo = $nvidiaSmiOutput.Split(",")
    Write-Result "GPU Name" $gpuInfo[0].Trim()
    Write-Result "VRAM" $gpuInfo[1].Trim()
    Write-Result "NVIDIA Driver" $gpuInfo[2].Trim()
    Write-Result "nvidia-smi" "PASS"
} catch {
    Write-Result "nvidia-smi" "FAIL - Driver or GPU not detected" $true
}

# Python & Node
Write-Host "RUNTIME" -ForegroundColor Yellow
$pythonVer = (python --version 2>&1)
Write-Result "Python" $pythonVer

$nodeVer = (node -v 2>&1)
Write-Result "Node.js" $nodeVer

# Python Environment Check
Write-Host "PYTHON DEPENDENCIES" -ForegroundColor Yellow
$venvPath = Join-Path $ProjectRoot "ml-service\venv\Scripts\python.exe"

if (Test-Path $venvPath) {
    Write-Result "Virtual Environment" "EXISTS"
    
    $pythonCheckScript = @"
import sys
try:
    import torch
    import transformers
    import rasterio
    import bitsandbytes
    print('PASS')
except ImportError as e:
    print(f'FAIL: {e}')
"@
    
    $checkResult = & $venvPath -c $pythonCheckScript
    if ($checkResult -match "PASS") {
        Write-Result "Dependencies (Torch, Transformers, Rasterio, BNB)" "PASS"
    } else {
        Write-Result "Dependencies" $checkResult $true
    }
    
    $cudaCheckScript = @"
import torch
print('PyTorch:', torch.__version__)
print('CUDA Runtime:', torch.version.cuda)
print('CUDA Available:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('GPU Detected by PyTorch:', torch.cuda.get_device_name(0))
"@
    
    $cudaResult = & $venvPath -c $cudaCheckScript
    Write-Result "PyTorch CUDA Status" $cudaResult
} else {
    Write-Result "Virtual Environment" "MISSING - Run setup.ps1" $true
}

# Env Files
Write-Host "CONFIGURATION" -ForegroundColor Yellow
if (Test-Path "ml-service\.env") { Write-Result "ML Service .env" "EXISTS" } else { Write-Result "ML Service .env" "MISSING" $true }
if (Test-Path "backend\.env") { Write-Result "Backend .env" "EXISTS" } else { Write-Result "Backend .env" "MISSING" $true }

Write-Heading "VERIFICATION COMPLETE"
Write-Host "If everything above is green and PyTorch says CUDA Available: True, you are ready to start!" -ForegroundColor Cyan
Write-Host "Run .\scripts\verify-geochat.ps1 for a deeper GeoChat smoke test, or run .\scripts\start.ps1 to launch." -ForegroundColor Yellow
Write-Host ""
