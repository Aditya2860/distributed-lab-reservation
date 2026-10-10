# Windows Setup Guide

Follow these steps to run the Distributed Lab and Equipment Reservation System natively on Windows 11 without Docker or WSL.

## Prerequisites
1. **Python 3.10+**: Must be installed and added to your system PATH. You can download it from [python.org](https://www.python.org/downloads/).
2. **Node.js & npm**: Must be installed and added to your system PATH. Download from [nodejs.org](https://nodejs.org/).

## Setup Instructions

### 1. Open Terminal
Open PowerShell or Git Bash and navigate to the root directory of the project:
```powershell
cd "C:\path\to\distributed-lab-reservation"
```

### 2. Create Virtual Environment
Create and activate a Python virtual environment to isolate dependencies:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
*(If execution policies block the activation script, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` as Administrator, or simply use `start_local.py` which uses your global Python if you prefer not to use a venv).*

### 3. Install Backend Dependencies
With the virtual environment active, install requirements for both the nodes and the gateway:
```powershell
pip install -r node_service/requirements.txt
pip install -r gateway/requirements.txt
```
*Note: We use SQLite in this native setup to avoid requiring a separate PostgreSQL server installation, simplifying the process for evaluation.*

### 4. Install Frontend Dependencies
Navigate to the frontend directory and install the Node packages:
```powershell
cd frontend
npm install
cd ..
```

### 5. Start the Cluster
You can start all services (Gateway, 3 Nodes, and the React Frontend) using the provided PowerShell script.
```powershell
.\scripts\start_all.ps1
```

If your execution policies block powershell scripts, you can run the python orchestrator script directly:
```powershell
python start_local.py
```

### 6. Open the Dashboard
Once the services start and leader election finishes (takes ~8 seconds), open your browser to:
**http://localhost:3000**

### 7. Stopping the Services
If you used the PowerShell script, stop them cleanly with:
```powershell
.\scripts\stop_all.ps1
```
If you used `python start_local.py`, simply press `Ctrl+C` in that terminal.
