import os
import pika
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "localhost")


def publish_event(event_type: str, payload: dict):
    """
    Publish an event to RabbitMQ.
    If RabbitMQ is unavailable, logs a warning and returns silently —
    the reservation is already committed to the DB and is not rolled back.
    """
    connection = None
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=RABBITMQ_URL,
                connection_attempts=1,
                retry_delay=0,
                socket_timeout=2,
            )
        )
        channel = connection.channel()
        channel.exchange_declare(exchange='reservation_events', exchange_type='fanout')

        message = {
            "event_type": event_type,
            "payload": payload,
        }
        channel.basic_publish(
            exchange='reservation_events',
            routing_key='',
            body=json.dumps(message),
        )
        logger.info(f"Published event {event_type} to RabbitMQ.")

    except pika.exceptions.AMQPConnectionError:
        logger.warning(
            f"⚠️  Could not publish '{event_type}' — RabbitMQ not reachable. "
            "Event skipped; reservation is still committed to DB."
        )
    except Exception as e:
        logger.warning(f"⚠️  Error publishing event '{event_type}': {e}")
    finally:
        if connection and not connection.is_closed:
            try:
                connection.close()
            except Exception:
                pass
