Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OrganLink Node.js Express Backend Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\server"

Write-Host "Launching Node.js Express server on http://localhost:5000..." -ForegroundColor Green
npm run dev
