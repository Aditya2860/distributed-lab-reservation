# Distributed Lab and Equipment Reservation System

This is a complete implementation of a fault-tolerant distributed system that coordinates shared resource reservations (laboratories, projectors, equipment) across multiple independent nodes.

This project was built to satisfy both Formative Assessment 1 (FA-1) and Formative Assessment 2 (FA-2) requirements, demonstrating synchronous/asynchronous communication, logical event ordering, distributed mutual exclusion, and leader election.

## Architecture

* **Frontend:** React + Vite SPA (Running on Port 3000)
* **API Gateway:** FastAPI reverse proxy that routes traffic to backend nodes (Running on Port 8000)
* **Node Services:** Three independent FastAPI instances (`node-a`, `node-b`, `node-c`) executing distributed algorithms.
* **Database:** PostgreSQL for persisting reservations and resources.
* **Message Broker:** RabbitMQ for asynchronous event propagation (e.g. `ReservationConfirmed` events).

## Distributed Algorithms Implemented
1. **Lamport Logical Clocks:** Ensures events are causally ordered across the distributed nodes.
2. **Lamport's Mutual Exclusion:** Prevents concurrent nodes from double-booking a resource by acquiring distributed locks through `REQUEST`, `REPLY`, and `RELEASE` broadcast messages.
3. **Bully Leader Election:** Nodes have an ordered priority. If the coordinator crashes (simulated via Docker), the nodes detect the missing heartbeat and seamlessly elect a new leader.

---

## Prerequisites

To run this project locally on Windows WITHOUT Docker, ensure you have:
* **Python 3.10+** (Added to PATH)
* **Node.js & npm** (Added to PATH)

---

## Step-by-Step Instructions to Run the Project

### 1. Initial Setup
Open your terminal (PowerShell) and navigate to the project root:
```powershell
cd "C:\Users\Aditya\OneDrive\Desktop\Personal Project\DS Project\distributed-lab-reservation"
```
Install the Python and Node dependencies:
```powershell
pip install -r node_service/requirements.txt
pip install -r gateway/requirements.txt
cd frontend
npm install
cd ..
```

### 2. Start the Distributed Cluster
We have provided a native PowerShell script that starts the API Gateway, all 3 backend nodes, and the React frontend simultaneously:
```powershell
.\scripts\start_all.ps1
```
*(If your execution policy blocks scripts, you can run `python start_local.py` instead).*

### 3. Open the Dashboard
Open your web browser and go to:
**http://localhost:3000**

### 4. Stop the Services
When you're done, run the stop script to cleanly kill all background processes:
```powershell
.\scripts\stop_all.ps1
```

### Step 2: Start the Cluster Locally
Run the local orchestration script that launches the 3 Nodes, the API Gateway, and the React frontend simultaneously:
```bash
python start_local.py
```
*(This script bypasses Docker and runs everything natively using SQLite instead of PostgreSQL).*

### Step 3: Access the Frontend Dashboard
Once the services are running, open your web browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

You will see the **Distributed Lab Reservation System** dashboard.

---

## Testing the Distributed Features (Demonstration Guide)

### 1. Test Reservation (Mutual Exclusion & Logical Clocks)
1. In the web UI, click **"Request Reservation"**.
2. The UI will send the request to the Gateway, which forwards it to a random Node.
3. Behind the scenes, the receiving Node executes **Lamport's Mutual Exclusion** algorithm, exchanging `REQUEST` and `REPLY` messages with the other local nodes on ports `8001`, `8002`, `8003`.
4. Once the lock is acquired, it writes to the local SQLite database, broadcasts a `RELEASE`, and increments the logical clock.
5. You will see a success message with the incremented **Logical Time**, and the cluster table's logical times will sync up.

### 2. Test Fault Tolerance (Bully Leader Election)
1. Look at the Cluster Status table on the frontend and identify the current **Coordinator**.
2. You can simulate a node crash by pressing `Ctrl + C` in the terminal to kill the script, then edit `start_local.py` to comment out one of the nodes and restart it. Or simply let the nodes run, they will elect a leader automatically based on who is available!

---

## Stopping the Application

To shut down the cluster and clean up the running processes, simply press `Ctrl + C` in the terminal where `start_local.py` is running.
