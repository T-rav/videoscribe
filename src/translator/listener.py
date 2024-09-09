from datetime import datetime
import logging
import os
from rabbitmq_listener import RabbitMQListener

logs_dir = 'logs'
os.makedirs(logs_dir, exist_ok=True)
log_filename = os.path.join(logs_dir, f"transcription_{datetime.now().strftime('%Y-%m-%d')}.log")
logging.basicConfig(filename=log_filename, level=logging.DEBUG, format='%(asctime)s %(levelname)s:%(message)s')

def process_transcription_message(message):
    logging.info(f"Processing message: {message}")
    # todo : integrate with the translator service in app.py to bring this to life!!!
    # todo : add in the ability to send updates back to the api via rabbitmq

if __name__ == "__main__":
    listener = RabbitMQListener()
    try:
        listener.listen(process_transcription_message)
    except KeyboardInterrupt:
        logging.info("Interrupted by user")
    finally:
        if listener.connection and not listener.connection.is_closed:
            listener.connection.close()
            logging.info("Connection to RabbitMQ closed")
