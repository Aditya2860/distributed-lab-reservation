# Viva Questions and Answers

## 1. What is the difference between a distributed application and a distributed database?
**Answer:** A distributed application has processing and logic spread across multiple independent nodes that communicate over a network (like our Node A, B, and C). A distributed database spreads data storage across multiple nodes (replication or sharding). In our project, the application is distributed, but the database is a single shared instance.

## 2. What is a Lamport Logical Clock?
**Answer:** It is a software counter maintained by each node to establish a partial ordering of events in a distributed system. It does not measure physical time. When an event occurs, the local clock increments. When a message is received, the node updates its clock to `max(local_clock, message_timestamp) + 1`.

## 3. How does Mutual Exclusion work in your system?
**Answer:** We implemented Lamport's Mutual Exclusion. When a node wants to make a reservation, it sends a `REQUEST` to all other nodes. It enters the critical section only when its request is at the top of its local queue and it has received `REPLY` messages from all other nodes. Once done, it broadcasts a `RELEASE` message.

## 4. Why not just use database transactions for concurrency?
**Answer:** Database transactions alone can handle simple concurrency, but they represent a single point of bottleneck. By implementing distributed mutual exclusion, the application layer coordinates access, reducing lock contention on the database and demonstrating decentralized coordination concepts.

## 5. What is the Bully Algorithm?
**Answer:** An election algorithm where nodes have distinct priorities (or IDs). If a node detects the leader has failed, it sends an `ELECTION` message to all nodes with higher priorities. If no higher-priority node responds, it declares itself the leader and broadcasts a `COORDINATOR` message.

## 6. How does your system detect failures?
**Answer:** Nodes send periodic heartbeats to the coordinator or other nodes. If a node fails to respond within a specific timeout, it is marked as offline, and its failure can trigger a new election or prevent it from participating in mutual exclusion.

## 7. What happens if a node crashes during a mutual exclusion request?
**Answer:** In the basic algorithm, the system might block waiting for a reply. In our implementation, we added a timeout and graceful fallback to ensure the system remains available (liveness) if a node crashes.

## 8. What is the difference between Synchronous and Asynchronous communication?
**Answer:** Synchronous communication (like our HTTP APIs) requires the sender to wait for a response before proceeding. Asynchronous communication (like RabbitMQ events) allows the sender to fire the message and continue working without blocking.

## 9. How do you prevent double bookings?
**Answer:** Through a combination of distributed mutual exclusion (which serializes requests for the same resource) and a database constraint/transaction (which serves as a final safety check before saving).

## 10. Why do we need Leader Election?
**Answer:** Some tasks are best handled by a single node to avoid duplication (e.g., background aggregation, scheduled cleanup). Leader election ensures exactly one node is designated to perform these tasks, even if nodes crash or join.
