from datetime import datetime, time
import json
import logging
import os
import random
import pika
from dotenv import load_dotenv

# Configure logging
 # Load environment variables from .env file
load_dotenv()

# Create logs directory if it doesn't exist
logs_dir = 'logs'
os.makedirs(logs_dir, exist_ok=True)

# Generate a log file name with the current date
log_filename = os.path.join(logs_dir, f"transcription_{datetime.now().strftime('%Y-%m-%d')}.log")

# Configure logging with the date in the file name
logging.basicConfig(filename=log_filename, level=logging.DEBUG, format='%(asctime)s %(levelname)s:%(message)s')

# Load RabbitMQ connection details from environment variables
rabbitmq_url = os.getenv("RABBITMQ_CONNECTION_STRING")
queue_name = os.getenv("TRANSCRIPTION_QUEUE_NAME")
dead_letter_exchange = os.getenv("DEAD_LETTER_EXCHANGE")
def callback(ch, method, properties, body):
    logging.info(f"Received message from RabbitMQ: {body}")
    try:
        # Parse the content into a dictionary
        transcription_message = json.loads(body)
        
        # Log the parsed content
        logging.info(f"Parsed Transcription Message: {transcription_message}")
        
        # Add your processing logic here
        process_transcription_message(transcription_message)

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse JSON content: {e} for message: {body}")
        time.sleep(random.randint(1, 3))  # sleep to not instantly re-queue the message

        # Extract retry count from headers or set to 0 if not set
        retry_count = properties.headers.get("x-retry-count", 0) if properties.headers else 0

        # Check if we've retried enough times
        if retry_count >= 5:
            # Don't requeue the message, it will go to the DLX
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        else:
            # Add or increment the retry count in the headers
            properties.headers = properties.headers or {}
            properties.headers["x-retry-count"] = retry_count + 1

            # Re-publish with updated headers
            ch.basic_publish(
                exchange="",
                routing_key=queue_name,
                body=body,
                properties=pika.BasicProperties(headers=properties.headers)
            )

            # Acknowledge the original message
            ch.basic_ack(delivery_tag=method.delivery_tag)

def process_transcription_message(message):
    # Add your message processing logic here
    logging.info(f"Processing message: {message}")
    # todo : integrate with the translator service in app.py to bring this to life!!!
    # todo : add in the ability to send updates back to the api via rabbitmq

def listen_to_rabbitmq():
    connection = pika.BlockingConnection(pika.URLParameters(rabbitmq_url))
    channel = connection.channel()

    # Declare the main queue with DLX settings
    channel.queue_declare(
        queue=queue_name,
        durable=True,
        arguments={
            'x-dead-letter-exchange': dead_letter_exchange,
            'x-message-ttl': 1000 * 60 * 60 * 24 * 7  # 1 week in milliseconds
        }
    )

    # Declare the dead-letter queue
    dead_letter_queue = f"{queue_name}_dlq"
    channel.queue_declare(queue=dead_letter_queue, durable=True)

    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=False)
    logging.info(f"Listening for messages on RabbitMQ queue: {queue_name}")
    channel.start_consuming()

if __name__ == "__main__":
    listen_to_rabbitmq()
