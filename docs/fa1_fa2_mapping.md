# FA-1 and FA-2 Syllabus Mapping

This document maps the project deliverables and features to the academic syllabus.

## FA-1: Basic Distributed Application (Units I & II)

| Feature | Syllabus Concept |
| :--- | :--- |
| **Multiple FastAPI Nodes** | **Distributed system architecture and middleware.** Nodes run as separate processes (ports 8001, 8002, 8003). |
| **React Frontend & API Gateway** | **Service boundaries and HTTP communication.** The gateway routes requests; the frontend consumes distributed services. |
| **PostgreSQL / SQLite Persistence** | **Shared data storage.** Demonstrates saving distributed events transactionally. |
| **Basic Heartbeats (Node Status)** | **Fault detection fundamentals.** Nodes expose a `/health` and `/node/info` endpoint for monitoring. |
| **RabbitMQ Integration (Optional)** | **Asynchronous message-oriented middleware (MOM).** Publish/Subscribe pattern for events (falls back gracefully if not running). |

## FA-2: Distributed Coordination (Units III & IV)

| Feature | Syllabus Concept |
| :--- | :--- |
| **Lamport Logical Clocks** | **Unit III: Logical Clocks.** Every node maintains a clock. Messages carry timestamps. Clocks update as `max(local, message) + 1`. |
| **Lamport's Mutual Exclusion** | **Unit III: Distributed Mutual Exclusion.** Concurrent reservation requests are serialized. A node must acquire the lock (REQUEST -> wait for REPLY -> ENTER -> RELEASE) before making a DB entry. |
| **Bully Leader Election** | **Unit III: Leader Election.** Nodes have priorities. If the coordinator stops sending heartbeats, the Bully algorithm runs to elect a new leader. |
| **Node Crash & Recovery** | **Unit IV: Fault Tolerance.** The dashboard visually detects when a node crashes, and the system automatically elects a new leader. |
| **Distributed Event Log** | **Observability.** The UI traces distributed coordination events in real-time, showing how nodes coordinate under the hood. |
