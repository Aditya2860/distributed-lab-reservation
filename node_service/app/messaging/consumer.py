import os
import pika
import json
import logging
import threading
import time
from algorithms.lamport_clock import clock

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "localhost")
_RABBITMQ_AVAILABLE = True  # will be set False after first failed attempt


def start_consumer():
    """
    Start the RabbitMQ consumer in a daemon thread.
    If RabbitMQ is not running, logs a warning and gives up gracefully —
    the node continues to operate normally without event broadcasting.
    """
    def consume():
        global _RABBITMQ_AVAILABLE
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                connection = pika.BlockingConnection(
                    pika.ConnectionParameters(
                        host=RABBITMQ_URL,
                        connection_attempts=1,
                        retry_delay=0,
                        socket_timeout=3,
                    )
                )
                channel = connection.channel()
                channel.exchange_declare(exchange='reservation_events', exchange_type='fanout')

                result = channel.queue_declare(queue='', exclusive=True)
                queue_name = result.method.queue

                channel.queue_bind(exchange='reservation_events', queue=queue_name)

                def callback(ch, method, properties, body):
                    message = json.loads(body)
                    event_type = message.get("event_type")
                    payload = message.get("payload", {})
                    received_time = payload.get("logical_timestamp", 0)
                    new_time = clock.update(received_time)
                    logger.info(
                        f"Consumed event {event_type} | "
                        f"Message logical time: {received_time} | "
                        f"Updated local time: {new_time}"
                    )

                channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
                logger.info("✅ RabbitMQ consumer started successfully.")
                _RABBITMQ_AVAILABLE = True
                channel.start_consuming()  # blocks until connection drops
                return  # clean exit

            except pika.exceptions.AMQPConnectionError:
                logger.warning(
                    f"⚠️  RabbitMQ not reachable at '{RABBITMQ_URL}' "
                    f"(attempt {attempt}/{max_retries}). "
                    "Node will continue without event broadcasting."
                )
                if attempt < max_retries:
                    time.sleep(2)
            except Exception as e:
                logger.warning(f"⚠️  Consumer error: {e}. Node continuing without RabbitMQ.")
                break

        _RABBITMQ_AVAILABLE = False
        logger.warning(
            "🔕 RabbitMQ consumer disabled. "
            "Core reservation features still work via direct HTTP coordination."
        )

    thread = threading.Thread(target=consume, daemon=True)
    thread.start()
