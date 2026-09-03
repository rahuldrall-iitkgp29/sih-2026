<#
.SYNOPSIS
    Deep diagnostic script to verify the GeoChat model load and inference.
    
.DESCRIPTION
    This script initializes the GeoChat model into VRAM using the exact same
    adapter and loading logic used by the ML service. It then performs a
    minimal inference task to prove the GPU can successfully execute CUDA kernels
    without OOM (Out-Of-Memory) errors on the target machine.
#>

$ErrorActionPreference = "Stop"

function Write-Heading ($Title) {
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Cyan
}

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Heading "SATQUERY GEOCHAT VALIDATION"

$venvPath = Join-Path $ProjectRoot "ml-service\venv\Scripts\python.exe"
$testScript = Join-Path $ProjectRoot "ml-service\test_geochat.py"

if (-not (Test-Path $venvPath)) {
    Write-Host "ERROR: Python virtual environment not found. Run .\scripts\setup.ps1 first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $testScript)) {
    Write-Host "ERROR: Test script not found at $testScript" -ForegroundColor Red
    exit 1
}

Write-Host "Starting GeoChat smoke test. This may take 1-2 minutes as the model loads into VRAM..." -ForegroundColor Yellow
Write-Host ""

# Run the test script and capture output to the console
Set-Location (Join-Path $ProjectRoot "ml-service")
& $venvPath $testScript

if ($LASTEXITCODE -eq 0) {
    Write-Heading "GEOCHAT VALIDATION PASSED"
    Write-Host "The model loaded successfully onto the GPU and inference succeeded!" -ForegroundColor Green
} else {
    Write-Heading "GEOCHAT VALIDATION FAILED"
    Write-Host "The model failed to load or inference failed. Check the logs above." -ForegroundColor Red
    Write-Host "If this is a CUDA Out-Of-Memory error, your GPU may not have enough VRAM for the current configuration." -ForegroundColor Yellow
}
Write-Host ""
