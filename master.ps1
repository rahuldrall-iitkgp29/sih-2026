<#
.SYNOPSIS
    Master script to run all setup, verification, and start scripts for SatQuery in a single command.
    
.DESCRIPTION
    This script sequentially runs:
    1. scripts\setup.ps1 (Environment setup, dependencies, model download)
    2. scripts\verify.ps1 (System validation)
    3. scripts\verify-geochat.ps1 (GeoChat ML model loading test)
    4. scripts\start.ps1 (Starts the application components)
#>

$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       SATQUERY MASTER SETUP & START SCRIPT         " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host ">>> STEP 1: RUNNING SETUP SCRIPT <<<" -ForegroundColor Magenta
& .\scripts\setup.ps1
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host "Setup script failed. Exiting master script." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host ">>> STEP 2: RUNNING VERIFICATION SCRIPT <<<" -ForegroundColor Magenta
& .\scripts\verify.ps1
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host "Verification script failed. Exiting master script." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host ">>> STEP 3: RUNNING GEOCHAT VERIFICATION SCRIPT <<<" -ForegroundColor Magenta
Write-Host "This will test loading the model into VRAM." -ForegroundColor DarkGray
& .\scripts\verify-geochat.ps1
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host "GeoChat verification script failed. Exiting master script." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       SETUP AND VERIFICATION SUCCESSFUL            " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host ">>> STEP 4: STARTING APPLICATION <<<" -ForegroundColor Magenta
& .\scripts\start.ps1
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host "Start script failed." -ForegroundColor Red
    exit 1
}
