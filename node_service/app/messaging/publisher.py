import os
import pika
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "localhost")

def get_connection():
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_URL))
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")
        return None

def publish_event(event_type: str, payload: dict):
    connection = get_connection()
    if not connection:
        return

    try:
        channel = connection.channel()
        channel.exchange_declare(exchange='reservation_events', exchange_type='fanout')

        message = {
            "event_type": event_type,
            "payload": payload
        }
        channel.basic_publish(
            exchange='reservation_events',
            routing_key='',
            body=json.dumps(message)
        )
        logger.info(f"Published event {event_type} to RabbitMQ.")
    except Exception as e:
        logger.error(f"Error publishing event: {e}")
    finally:
        connection.close()
