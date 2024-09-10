import pika
import os
import logging
import time
import json
import random
from dotenv import load_dotenv
from translator.listeners.abstract_listener import AbstractJobListener

load_dotenv()

rabbitmq_url = os.getenv("RABBITMQ_CONNECTION_STRING")
job_queue_name = os.getenv("TRANSCRIPTION_JOB_QUEUE_NAME")
update_queue_name = os.getenv('TRANSCRIPTION_UPDATE_QUEUE_NAME')
dead_letter_exchange = os.getenv("DEAD_LETTER_EXCHANGE")
max_retries = os.getenv("MAX_RETRIES", 5)

class RabbitMQListener(AbstractJobListener):
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
        self.handler = handler # set the handler to the handler passed in, this way we can centralize the retry logic for the callback
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
            update = self.handler(transcription_message)
            
            if update is not None:
                try:
                    update_message = json.dumps(update)
                    self.publish_job_update(update_message)
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except (TypeError, ValueError) as e:
                    raise ValueError(f"Failed to serialize update object: {e}")
            else:
                raise ValueError(f"Invalid update object: {update}")
        except (json.JSONDecodeError, ValueError) as e:
            logging.error(f"Error processing message: {e} for message: {body}")
            time.sleep(random.randint(1, 5))  # sleep to not instantly re-queue the message
            retry_count = properties.headers.get("x-retry-count", 0) if properties.headers else 0
            if retry_count >= max_retries:
                logging.error(f"Max retries reached for message: {body}")
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


    def publish_job_update(self, message):
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
