# Start All Services - Distributed Lab Reservation System
# Usage: .\scripts\start_all.ps1

$Root = Split-Path $PSScriptRoot -Parent
$Python = "python"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Distributed Lab Reservation System" -ForegroundColor Cyan
Write-Host " Starting all services..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Seed database first
Write-Host "`n[0/5] Seeding database..." -ForegroundColor Yellow
& $Python "$Root\seed_data.py"

# Node A
Write-Host "`n[1/5] Starting Node A (port 8001)..." -ForegroundColor Yellow
$envA = @{
    NODE_ID    = "node-a"
    PORT       = "8001"
    OTHER_NODES = "http://localhost:8002,http://localhost:8003"
}
$nodeA = Start-Process -FilePath $Python `
    -ArgumentList "-m uvicorn main:app --port 8001" `
    -WorkingDirectory "$Root\node_service\app" `
    -PassThru -WindowStyle Minimized `
    -RedirectStandardOutput "$Root\logs\node-a.log" `
    -RedirectStandardError "$Root\logs\node-a-err.log"

# Wait briefly so node-a creates DB tables first
Start-Sleep -Seconds 2

# Node B
Write-Host "[2/5] Starting Node B (port 8002)..." -ForegroundColor Yellow
$nodeB = Start-Process -FilePath $Python `
    -ArgumentList "-m uvicorn main:app --port 8002" `
    -WorkingDirectory "$Root\node_service\app" `
    -Environment @{ NODE_ID="node-b"; PORT="8002"; OTHER_NODES="http://localhost:8001,http://localhost:8003" } `
    -PassThru -WindowStyle Minimized `
    -RedirectStandardOutput "$Root\logs\node-b.log" `
    -RedirectStandardError "$Root\logs\node-b-err.log"

Start-Sleep -Seconds 2

# Node C
Write-Host "[3/5] Starting Node C (port 8003)..." -ForegroundColor Yellow
$nodeC = Start-Process -FilePath $Python `
    -ArgumentList "-m uvicorn main:app --port 8003" `
    -WorkingDirectory "$Root\node_service\app" `
    -Environment @{ NODE_ID="node-c"; PORT="8003"; OTHER_NODES="http://localhost:8001,http://localhost:8002" } `
    -PassThru -WindowStyle Minimized `
    -RedirectStandardOutput "$Root\logs\node-c.log" `
    -RedirectStandardError "$Root\logs\node-c-err.log"

Start-Sleep -Seconds 2

# Gateway
Write-Host "[4/5] Starting Gateway (port 8000)..." -ForegroundColor Yellow
$gateway = Start-Process -FilePath $Python `
    -ArgumentList "-m uvicorn main:app --port 8000" `
    -WorkingDirectory "$Root\gateway\app" `
    -Environment @{ NODE_A_URL="http://localhost:8001"; NODE_B_URL="http://localhost:8002"; NODE_C_URL="http://localhost:8003" } `
    -PassThru -WindowStyle Minimized `
    -RedirectStandardOutput "$Root\logs\gateway.log" `
    -RedirectStandardError "$Root\logs\gateway-err.log"

# Frontend
Write-Host "[5/5] Starting Frontend (port 3000)..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "npm" `
    -ArgumentList "run dev -- --port 3000" `
    -WorkingDirectory "$Root\frontend" `
    -PassThru -WindowStyle Minimized `
    -RedirectStandardOutput "$Root\logs\frontend.log" `
    -RedirectStandardError "$Root\logs\frontend-err.log"

# Save PIDs for stop script
$pids = @{
    node_a   = $nodeA.Id
    node_b   = $nodeB.Id
    node_c   = $nodeC.Id
    gateway  = $gateway.Id
    frontend = $frontend.Id
}
$pids | ConvertTo-Json | Set-Content "$Root\logs\pids.json"

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " All services started!" -ForegroundColor Green
Write-Host " Frontend :  http://localhost:3000" -ForegroundColor Green
Write-Host " Gateway  :  http://localhost:8000" -ForegroundColor Green
Write-Host " Node A   :  http://localhost:8001" -ForegroundColor Green
Write-Host " Node B   :  http://localhost:8002" -ForegroundColor Green
Write-Host " Node C   :  http://localhost:8003" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host " Logs saved to: $Root\logs\" -ForegroundColor Gray
Write-Host " Run .\scripts\stop_all.ps1 to stop all services." -ForegroundColor Gray
