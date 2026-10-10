# Distributed Lab & Equipment Reservation System Diagrams

You can use the code blocks below to generate diagrams in StarUML (using the PlantUML extension), Draw.io, or standard Markdown viewers that support Mermaid.

## 1. High-Level System Architecture

```plantuml
@startuml
skinparam componentStyle uml2

package "Client Layer" {
  [React Frontend (Port 3000)] as UI
}

package "API Gateway Layer" {
  [FastAPI Gateway (Port 8000)] as Gateway
}

package "Distributed Nodes (FastAPI)" {
  [Node A (Port 8001)] as NodeA
  [Node B (Port 8002)] as NodeB
  [Node C (Port 8003)] as NodeC
}

package "Messaging & Coordination" {
  queue "RabbitMQ (Port 5672)" as MessageBroker
}

database "Persistence" {
  [SQLite Database] as DB
}

' Relationships
UI --> Gateway : HTTP REST
Gateway --> NodeA : Forward Request (Random)
Gateway --> NodeB : Forward Request (Random)
Gateway --> NodeC : Forward Request (Random)

NodeA <--> MessageBroker : AMQP (Bully/Mutex)
NodeB <--> MessageBroker : AMQP (Bully/Mutex)
NodeC <--> MessageBroker : AMQP (Bully/Mutex)

NodeA --> DB : Read/Write
NodeB --> DB : Read/Write
NodeC --> DB : Read/Write
@enduml
```

---

## 2. Detailed Internal Component Architecture

This diagram breaks down the specific internal software components operating inside a single distributed Node, the Gateway, and the exact database tables and message queues involved.

```plantuml
@startuml
skinparam componentStyle uml2
skinparam linetype ortho

package "Client App" {
  [React SPA\n(Student/Admin Portals)] as React
}

package "API Gateway (FastAPI)" {
  [Auth & JWT Middleware] as JWT
  [Round-Robin Router] as Router
}

package "Distributed Node (FastAPI)" {
  package "REST API Controllers" {
    [Reservation API] as ResAPI
    [Cluster Info API] as ClusterAPI
  }
  
  package "Distributed Algorithms" {
    [Bully Leader Election] as Bully
    [Lamport Mutual Exclusion] as Mutex
    [Logical Clock] as Clock
  }
  
  package "Database ORM (SQLAlchemy)" {
    [Session Manager] as Session
  }
}

database "SQLite Persistent Storage" {
  folder "Tables" {
    [Users Table]
    [Resources Table]
    [Reservations Table]
  }
}

queue "RabbitMQ Message Broker" {
  [Election Exchange (Fanout)] as ElectionQ
  [Mutex Exchange (Fanout)] as MutexQ
}

' Client to Gateway
React --> JWT : POST /token (Login)
React --> Router : GET/POST API Requests

' Gateway to Node
Router --> ResAPI : Forwarded Requests

' Node Internals
ResAPI --> Mutex : Request Critical Section
ResAPI --> Clock : Increment Logical Time
ClusterAPI --> Bully : Check Coordinator Status

' Algorithms to Broker
Bully <--> ElectionQ : Broadcast ELECTION/COORDINATOR
Mutex <--> MutexQ : Broadcast REQUEST/REPLY/RELEASE

' Node to DB
ResAPI --> Session
Session --> [Reservations Table] : Create/Read/Delete
Session --> [Users Table] : Auth Verify
Session --> [Resources Table] : Check Availability

@enduml
```

---

## 3. Sequence Diagram: Reservation Flow (Mutual Exclusion)

This diagram visualizes what happens when a student requests a lab reservation. It showcases the Lamport Distributed Mutual Exclusion algorithm preventing double-bookings.

```plantuml
@startuml
autonumber

actor "Student" as User
participant "Frontend" as UI
participant "API Gateway" as Gateway
participant "Node A (Selected)" as NodeA
participant "Node B" as NodeB
participant "Node C" as NodeC
database "SQLite DB" as DB

User -> UI : Clicks "Reserve Lab"
UI -> Gateway : POST /reservations
Gateway -> NodeA : Forward POST /internal/reservation-request
activate NodeA

note over NodeA: Node A wants to write to DB.\nInitiates Lamport Mutual Exclusion.

NodeA -> NodeB : Broadcast REQUEST (Timestamp, NodeA)
NodeA -> NodeC : Broadcast REQUEST (Timestamp, NodeA)

NodeB --> NodeA : Send REPLY
NodeC --> NodeA : Send REPLY

note over NodeA: Node A receives all replies\nand enters Critical Section.

NodeA -> DB : Check for overlapping reservations
DB --> NodeA : No overlap found
NodeA -> DB : Insert new Reservation
DB --> NodeA : Success

NodeA -> NodeB : Broadcast RELEASE (NodeA)
NodeA -> NodeC : Broadcast RELEASE (NodeA)

note over NodeA: Node A leaves Critical Section.

NodeA --> Gateway : 200 OK (Reservation Confirmed)
deactivate NodeA

Gateway --> UI : 200 OK
UI --> User : Displays "Reservation Successful"

@enduml
```

---

## 4. Sequence Diagram: Leader Election (Bully Algorithm)

This diagram details how nodes discover who is in charge (the coordinator) when the system starts or when a node fails.

```plantuml
@startuml
autonumber

participant "Node A\n(Priority 1)" as NodeA
participant "Node B\n(Priority 2)" as NodeB
participant "Node C\n(Priority 3)" as NodeC

note over NodeA, NodeC: System starts. All nodes want to find a leader.

NodeA -> NodeB : ELECTION (Sender: Node A)
NodeA -> NodeC : ELECTION (Sender: Node A)

NodeB --> NodeA : ALIVE / OK (I have higher priority)
NodeB -> NodeC : ELECTION (Sender: Node B)

NodeC --> NodeA : ALIVE / OK (I have higher priority)
NodeC --> NodeB : ALIVE / OK (I have higher priority)

note over NodeC: Node C has the highest priority and receives no 'OK' messages\nfrom higher priority nodes.

NodeC -> NodeA : COORDINATOR (Sender: Node C)
NodeC -> NodeB : COORDINATOR (Sender: Node C)

note over NodeA, NodeC: Node C is now recognized as the Leader.

@enduml
```
