from datetime import datetime
import json
import logging
import os
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

def callback(ch, method, properties, body):
    logging.info(f"Received message from RabbitMQ: {body}")
    try:
        # Parse the content into a dictionary
        transcription_message = json.loads(body)
        
        # Log the parsed content
        logging.info(f"Parsed Transcription Message: {transcription_message}")
        
        # Add your processing logic here
        process_transcription_message(transcription_message)
    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse JSON content: {e} for message: {body}")

def process_transcription_message(message):
    # Add your message processing logic here
    logging.info(f"Processing message: {message}")
    # todo : integrate with the translator service in app.py to bring this to life!!!
    # todo : add in the ability to send updates back to the api via rabbitmq

def listen_to_rabbitmq():
    connection = pika.BlockingConnection(pika.URLParameters(rabbitmq_url))
    channel = connection.channel()
    channel.queue_declare(queue=queue_name, durable=True)

    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
    logging.info(f"Listening for messages on RabbitMQ queue: {queue_name}")
    channel.start_consuming()

if __name__ == "__main__":
    listen_to_rabbitmq()
