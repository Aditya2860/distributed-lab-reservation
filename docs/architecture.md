# Architecture

This project is a Distributed Lab and Equipment Reservation System.

## Overview
The system consists of:
1. **Frontend (React)**: Provides a dashboard to students and administrators.
2. **API Gateway (FastAPI)**: Routes client requests to a healthy backend node.
3. **Backend Nodes (FastAPI)**: Multiple independent processes (Node A, Node B, Node C) that handle requests, coordinate with each other using distributed algorithms, and persist data.
4. **Database (SQLite/PostgreSQL)**: Shared persistent storage for resources and reservations.

## Distributed Algorithms Implemented
- **Lamport Logical Clocks**: Used to order events consistently across the system.
- **Lamport Mutual Exclusion**: Ensures that conflicting concurrent requests to the same resource are serialized. Nodes must acquire a distributed lock before creating a reservation.
- **Bully Leader Election**: Nodes elect a coordinator based on priority. If the coordinator crashes, a new election is triggered by heartbeats.

## Database vs Distributed Application
While the database is shared (simulating a single persistence layer for simplicity), the application logic is distributed. Concurrency control is achieved using the distributed mutual exclusion algorithm before any database transaction is initiated. The database serves as a secondary safety mechanism.
