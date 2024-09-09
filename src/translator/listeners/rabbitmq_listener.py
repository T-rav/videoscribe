import pika
import os
import logging
import time
import json
import random
from dotenv import load_dotenv
from translator.listeners.abstract_listener import AbstractListener

load_dotenv()

rabbitmq_url = os.getenv("RABBITMQ_CONNECTION_STRING")
job_queue_name = os.getenv("TRANSCRIPTION_JOB_QUEUE_NAME")
update_queue_name = os.getenv('TRANSCRIPTION_UPDATE_QUEUE_NAME')
dead_letter_exchange = os.getenv("DEAD_LETTER_EXCHANGE")

class RabbitMQListener(AbstractListener):
    def __init__(self):
        self.connection = None
        self.channel = None
        self.handler = None
        self.establish_connection()

    def establish_connection(self):
        while True:
            try:
                self.connection = pika.BlockingConnection(pika.URLParameters(rabbitmq_url))
                self.channel = self.connection.channel()
                logging.info("Successfully connected to RabbitMQ")
                break
            except pika.exceptions.AMQPConnectionError as e:
                logging.error(f"Connection to RabbitMQ failed: {e}. Retrying in 5 seconds...")
                time.sleep(5)

    def listen(self, handler):
        self.handler = handler # set the handler to the handler passed in, this way we can avoid the retry logic in the callback
        self.establish_connection()
        self.channel.queue_declare(
            queue=job_queue_name,
            durable=True,
            arguments={
                'x-dead-letter-exchange': dead_letter_exchange,
                'x-message-ttl': 1000 * 60 * 60 * 24 * 7  # 1 week in milliseconds
            }
        )

        dead_letter_queue = f"{job_queue_name}_dlq"
        self.channel.queue_declare(queue=dead_letter_queue, durable=True)

        self.channel.basic_consume(queue=job_queue_name, on_message_callback=self.callback, auto_ack=False)
        logging.info(f"Listening for messages on RabbitMQ queue: {job_queue_name}")
        self.channel.start_consuming()

    def callback(self, ch, method, properties, body):
        logging.info(f"Received message from RabbitMQ: {body}")
        try:
            transcription_message = json.loads(body)
            logging.info(f"Parsed Transcription Message: {transcription_message}")
            self.handler(transcription_message)
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse JSON content: {e} for message: {body}")
            time.sleep(random.randint(1, 3))  # sleep to not instantly re-queue the message
            retry_count = properties.headers.get("x-retry-count", 0) if properties.headers else 0
            if retry_count >= 5:
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            else:
                properties.headers = properties.headers or {}
                properties.headers["x-retry-count"] = retry_count + 1
                ch.basic_publish(
                    exchange="",
                    routing_key=job_queue_name,
                    body=body,
                    properties=pika.BasicProperties(headers=properties.headers)
                )
                ch.basic_ack(delivery_tag=method.delivery_tag)


    def publish_to_rabbitmq(self, message):
        try:
            if self.channel is None or self.channel.is_closed:
                self.establish_connection()
            
            self.channel.queue_declare(queue=update_queue_name, durable=True)
            
            self.channel.basic_publish(
                exchange='',
                routing_key=update_queue_name,
                body=message,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # make message persistent
                ))
        except pika.exceptions.AMQPError as e:
            logging.error(f"Failed to publish message: {e}")
            self.establish_connection()  # Re-establish connection if it fails
