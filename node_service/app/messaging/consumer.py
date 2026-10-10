import os
import pika
import json
import logging
import threading
from algorithms.lamport_clock import clock

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "localhost")

def start_consumer():
    def consume():
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_URL))
            channel = connection.channel()
            channel.exchange_declare(exchange='reservation_events', exchange_type='fanout')
            
            result = channel.queue_declare(queue='', exclusive=True)
            queue_name = result.method.queue
            
            channel.queue_bind(exchange='reservation_events', queue=queue_name)
            
            def callback(ch, method, properties, body):
                message = json.loads(body)
                event_type = message.get("event_type")
                payload = message.get("payload", {})
                
                # Update Lamport clock on receiving message
                received_time = payload.get("logical_timestamp", 0)
                new_time = clock.update(received_time)
                
                logger.info(f"Consumed event {event_type} | Message logical time: {received_time} | Updated local time: {new_time}")
            
            channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
            logger.info("Started consuming RabbitMQ events.")
            channel.start_consuming()
        except Exception as e:
            logger.error(f"Consumer failed: {e}")

    thread = threading.Thread(target=consume, daemon=True)
    thread.start()
