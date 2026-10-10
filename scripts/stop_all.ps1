# Stop All Services
# Usage: .\scripts\stop_all.ps1

$Root = Split-Path $PSScriptRoot -Parent
$PidFile = "$Root\logs\pids.json"

if (Test-Path $PidFile) {
    $pids = Get-Content $PidFile | ConvertFrom-Json
    foreach ($key in $pids.PSObject.Properties.Name) {
        $pid = $pids.$key
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped $key (PID $pid)" -ForegroundColor Green
        } catch {
            Write-Host "Could not stop $key (PID $pid) - may already be stopped." -ForegroundColor Yellow
        }
    }
    Remove-Item $PidFile -Force
    Write-Host "`nAll services stopped." -ForegroundColor Cyan
} else {
    Write-Host "No PID file found. Services may not be running or were started manually." -ForegroundColor Yellow
    Write-Host "Run start_all.ps1 first, or use python start_local.py directly." -ForegroundColor Gray
}
