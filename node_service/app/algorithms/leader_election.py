import os
import threading
import time
import requests
import logging
from .lamport_clock import clock

logger = logging.getLogger(__name__)

NODE_ID = os.getenv("NODE_ID", "default-node")

# Priority is based on node letter: node-c > node-b > node-a
try:
    PRIORITY = int(os.getenv("NODE_PRIORITY", ord(NODE_ID[-1].upper())))
except:
    PRIORITY = 1

OTHER_NODES_STR = os.getenv("OTHER_NODES", "")
OTHER_NODES = [n for n in OTHER_NODES_STR.split(",") if n] if OTHER_NODES_STR else []

# Map other node URLs to their priorities by letter in their URL
def _url_priority(url):
    """Infer priority from node URL (e.g. 8003 -> 'c', priority 67)"""
    port_map = {"8001": ord("A"), "8002": ord("B"), "8003": ord("C")}
    for port, pri in port_map.items():
        if port in url:
            return pri
    return 0

# Only send ELECTION messages to nodes with HIGHER priority than us
HIGHER_PRIORITY_NODES = [url for url in OTHER_NODES if _url_priority(url) > PRIORITY]


class BullyElection:
    def __init__(self):
        self.coordinator_id = None
        self.is_coordinator = False
        self.active_election = False
        self.lock = threading.Lock()
        # Track whether we have ever seen a coordinator heartbeat
        self._coordinator_ever_known = False
        self.last_heartbeat = time.time()

    def start(self):
        """Start background heartbeat monitor and trigger initial election."""
        self.election_thread = threading.Thread(target=self._monitor_heartbeat, daemon=True)
        self.election_thread.start()
        # Small delay so all nodes are up before initial election
        threading.Timer(3.0, self.trigger_election).start()

    def trigger_election(self):
        """Run the Bully election algorithm."""
        with self.lock:
            if self.active_election:
                return
            self.active_election = True

        logger.info("Triggering Bully Election...")

        # Send ELECTION only to nodes with strictly HIGHER priority
        got_response = False
        for url in HIGHER_PRIORITY_NODES:
            try:
                res = requests.post(f"{url}/internal/election/message", json={
                    "type": "ELECTION",
                    "sender_id": NODE_ID,
                    "priority": PRIORITY
                }, timeout=2)
                if res.status_code == 200:
                    got_response = True
            except Exception:
                pass  # Node is down or unreachable

        if not got_response:
            # No higher-priority node responded — I win
            logger.info("No response from higher priority nodes. I am the new Coordinator!")
            self._become_coordinator()
        else:
            # A higher-priority node is alive; wait for it to broadcast COORDINATOR
            logger.info("Higher priority nodes responded. Waiting for COORDINATOR message.")
            # If no COORDINATOR message arrives in time, retry
            threading.Timer(5.0, self._check_coordinator_received).start()

        with self.lock:
            self.active_election = False

    def _check_coordinator_received(self):
        """If no coordinator was set after waiting, trigger another election."""
        with self.lock:
            if self.coordinator_id is None or not self._coordinator_ever_known:
                return  # Still waiting — will be handled by heartbeat monitor
            age = time.time() - self.last_heartbeat
        # If we still haven't received a COORDINATOR broadcast, retry
        if age > 8.0:
            logger.warning("No COORDINATOR message received after election. Retrying...")
            self.trigger_election()

    def receive_message(self, msg: dict):
        msg_type = msg.get("type")
        sender_id = msg.get("sender_id")
        sender_priority = msg.get("priority", 0)

        if msg_type == "ELECTION":
            if PRIORITY > sender_priority:
                # I have higher priority — respond OK and start my own election
                logger.info(f"Received ELECTION from {sender_id}. My priority {PRIORITY} is higher.")
                threading.Thread(target=self.trigger_election, daemon=True).start()
                return {"status": "ok", "priority": PRIORITY}
            # My priority is lower — ignore (the sender is higher priority)
            return {"status": "ignored"}

        elif msg_type == "COORDINATOR":
            with self.lock:
                self.coordinator_id = sender_id
                self.is_coordinator = False
                self.last_heartbeat = time.time()
                self._coordinator_ever_known = True
            logger.info(f"Node {sender_id} is the new Coordinator.")
            return {"status": "ok"}

        elif msg_type == "HEARTBEAT":
            with self.lock:
                self.coordinator_id = sender_id
                self.last_heartbeat = time.time()
                self._coordinator_ever_known = True
            return {"status": "ok"}

        return {"status": "unknown_message_type"}

    def _become_coordinator(self):
        with self.lock:
            self.is_coordinator = True
            self.coordinator_id = NODE_ID
            self.last_heartbeat = time.time()
            self._coordinator_ever_known = True

        logger.info(f"Broadcasting COORDINATOR message as {NODE_ID}")
        for url in OTHER_NODES:
            try:
                requests.post(f"{url}/internal/election/message", json={
                    "type": "COORDINATOR",
                    "sender_id": NODE_ID,
                    "priority": PRIORITY
                }, timeout=1)
            except Exception:
                pass

    def _monitor_heartbeat(self):
        # Initial grace period for all nodes to come online
        time.sleep(8)
        while True:
            time.sleep(3)
            with self.lock:
                is_coord = self.is_coordinator
                last_hb = self.last_heartbeat
                ever_known = self._coordinator_ever_known

            if is_coord:
                # Send heartbeat to all other nodes
                for url in OTHER_NODES:
                    try:
                        requests.post(f"{url}/internal/election/message", json={
                            "type": "HEARTBEAT",
                            "sender_id": NODE_ID
                        }, timeout=1)
                    except Exception:
                        pass
            elif ever_known:
                # We know who the coordinator is — check if it's still alive
                if time.time() - last_hb > 9.0:
                    logger.warning("Coordinator heartbeat timeout! Starting election.")
                    self.trigger_election()
            # If ever_known is False, the initial election timer will handle it


election = BullyElection()
