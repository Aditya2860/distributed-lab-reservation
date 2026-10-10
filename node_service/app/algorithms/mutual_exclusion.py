import os
import requests
import threading
import logging
import time
from .lamport_clock import clock

logger = logging.getLogger(__name__)
NODE_ID = os.getenv("NODE_ID", "default-node")
OTHER_NODES_STR = os.getenv("OTHER_NODES", "")
OTHER_NODES = OTHER_NODES_STR.split(",") if OTHER_NODES_STR else []

class LamportMutex:
    def __init__(self):
        self.queue = []
        self.lock = threading.Lock()
        self.replies_received = set()
        self.condition = threading.Condition(self.lock)
        
    def request_cs(self):
        ts = clock.increment()
        req = {"node_id": NODE_ID, "timestamp": ts, "type": "REQUEST"}
        
        with self.lock:
            self.queue.append(req)
            self._sort_queue()
            self.replies_received.clear()
            
        logger.info(f"Broadcasting REQUEST: {req}")
        self._broadcast(req)
        
        # Wait until we can enter the critical section (up to 10s total)
        deadline = time.time() + 10.0
        with self.condition:
            while not self._can_enter_cs(req):
                remaining = deadline - time.time()
                if remaining <= 0:
                    logger.warning("CS wait timed out — entering anyway (partial replies received).")
                    break
                self.condition.wait(timeout=min(1.0, remaining))
        logger.info("Entering Critical Section")
        return ts

    def release_cs(self):
        ts = clock.increment()
        req = {"node_id": NODE_ID, "timestamp": ts, "type": "RELEASE"}
        with self.lock:
            self.queue = [q for q in self.queue if q["node_id"] != NODE_ID]
        logger.info(f"Broadcasting RELEASE: {req}")
        self._broadcast(req)
        
    def receive_message(self, msg: dict):
        clock.update(msg["timestamp"])
        msg_type = msg["type"]
        sender = msg["node_id"]
        
        with self.lock:
            if msg_type == "REQUEST":
                self.queue.append(msg)
                self._sort_queue()
                self._send_reply(sender)
            elif msg_type == "REPLY":
                # Only count this reply if it's meant for us (or no target specified)
                target = msg.get("target", NODE_ID)
                if target == NODE_ID:
                    self.replies_received.add(sender)
            elif msg_type == "RELEASE":
                self.queue = [q for q in self.queue if q["node_id"] != sender]
            
            self.condition.notify_all()
            
    def _sort_queue(self):
        # Sort by timestamp, then by node_id
        self.queue.sort(key=lambda x: (x["timestamp"], x["node_id"]))
        
    def _can_enter_cs(self, req: dict):
        if not self.queue:
            return False
        is_top = self.queue[0]["node_id"] == NODE_ID
        has_all_replies = len(self.replies_received) == len(OTHER_NODES)
        return is_top and has_all_replies
        
    def _broadcast(self, msg: dict):
        for node_url in OTHER_NODES:
            if node_url:
                try:
                    requests.post(f"{node_url}/internal/coordination/message", json=msg, timeout=2)
                except Exception as e:
                    logger.error(f"Failed to send to {node_url}: {e}")

    def _send_reply(self, target_node_id: str):
        """Broadcast REPLY to all nodes. In Lamport's algorithm each node that receives
        a REQUEST replies to the requester. Since local URLs don't embed node IDs,
        we broadcast the REPLY to all; nodes not waiting on it simply ignore it."""
        ts = clock.increment()
        msg = {"node_id": NODE_ID, "timestamp": ts, "type": "REPLY", "target": target_node_id}
        for node_url in OTHER_NODES:
            if node_url:
                try:
                    requests.post(f"{node_url}/internal/coordination/message", json=msg, timeout=2)
                except Exception as e:
                    logger.error(f"Failed to send REPLY to {node_url}: {e}")

mutex = LamportMutex()
