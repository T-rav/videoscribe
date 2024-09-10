from datetime import datetime
import json
import logging
import os
from pydub import AudioSegment
from dotenv import load_dotenv
from services.audio.audio_downloader import AudioDownloader
from services.audio.audio_service import AudioService
from services.transcription.transcription_factory import TranscriptionFactory
from services.transcription.transcription_service import TranscriptionServiceType
from services.transformation.transformation_factory import TransformationFactory
from services.transformation.transformation_service import TranscriptionTransformation
from services.audio.file_handler import FileHandler
from listeners.rabbitmq_listener import RabbitMQListener
import validators
from azure.storage.blob import BlobServiceClient
import base64

def download_blob_to_local(blob_name, download_path):
    connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    
    logging.info(f"Connecting to Azure Storage {connect_str}")
    container_name, blob_path = blob_name.split('/', 1) # Extract container name and blob path
    blob_service_client = BlobServiceClient.from_connection_string(connect_str)
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_path)

    # Download the blob content to memory
    blob_data = blob_client.download_blob().readall()

    # Read the JSON content from the blob data
    data = json.loads(blob_data)
    content = data.get("content")
    file_name = data.get("fileName")
    
    # Decode the base64 content
    decoded_content = base64.b64decode(content)
    
    # Save the decoded content to the file system
    os.makedirs(download_path, exist_ok=True)
    content_path = os.path.join(download_path, file_name)
    with open(content_path, "wb") as content_file:
        content_file.write(decoded_content)
    
    logging.info(f"Extracted content saved to {content_path}")

    return content_path

def process_transcription_message(message):

    max_length_minutes = os.getenv("MAX_LENGTH_MINUTES")
    if max_length_minutes == "0":
        max_length_minutes = None
    
    path = os.getenv("PROCESSING_PATH")
    if path is None:
        path = "./incoming" # default it if missing

    url = message.get("content") # url or blob name
    if not validators.url(url): # its a blob name
        logging.info(f"Downloading blob {url}")
        local_file_path = os.path.join(path, "blobs")
        url = download_blob_to_local(url, local_file_path)
    else:
        logging.info(f"Processing url {url}")
    
    transform = message.get("transform") 
    prompt = None
    service = message.get("transcriptionType")

    return process_audio(url, 
                            transform, 
                            path, 
                            max_length_minutes, 
                            prompt, 
                            service)

def get_audio_duration(file_path: str) -> int:
    audio = AudioSegment.from_file(file_path)
    duration_seconds = len(audio) / 1000  # pydub returns length in milliseconds
    return duration_seconds

def process_audio(url, transform, path, max_length_minutes, prompt, service):
    logging.info("Processing audio...")

    if url.startswith("https://drive.google.com"):
        audio_file_path = AudioDownloader.download_google_drive_video(url, path, max_length_minutes=max_length_minutes)
        video_info = {"title": "Google Drive Video", "duration": get_audio_duration(audio_file_path)}  # Google Drive doesn't give video info easily
    elif "vimeo.com" in url:
        video_info = AudioDownloader.get_video_info(url)
        audio_file_path = AudioDownloader.download_vimeo_video(url, f'{path}/audio', max_length_minutes=max_length_minutes)
    elif url.startswith("https://"):
        video_info = AudioDownloader.get_video_info(url)
        audio_file_path = AudioDownloader.download_audio(url, f'{path}/audio', max_length_minutes=max_length_minutes)
    else:
        logging.info("Processing file...")
        audio_file_path = FileHandler.handle_local_file(url, path)
        os.remove(url) # remove the tmp file after audio is extracted
        video_info = {"title": os.path.basename(url), "duration": get_audio_duration(audio_file_path)}
    
    # todo: send media message !!!!!!

    logging.info(f"Audio file is ready at {audio_file_path}")

    if audio_file_path is not None:
        logging.info(f"Running transcription on {audio_file_path}")
        transcription_service = TranscriptionFactory.get_transcription_service(TranscriptionServiceType(service)) 
        combined_transcription = AudioService.transcribe_audio(audio_file_path, transcription_service, prompt)
        
        transcription_file_path = f'{os.path.splitext(audio_file_path)[0]}_transcript{transcription_service.file_name_extension()}'.replace("audio/", "transcript/")
        os.makedirs(os.path.dirname(transcription_file_path), exist_ok=True)
        
        logging.info(f"Writing transcript to {transcription_file_path}")
        with open(transcription_file_path, 'w', encoding='utf-8') as file:
            file.write(combined_transcription)

        try:
            # Adjust transcript if necessary
            logging.info("Adjusting transcript timings if needed...")
            combined_transcription, transcription_file_path = AudioService.adjust_transcript_if_needed(transcription_file_path, TranscriptionServiceType(service))

            # Run the transformation
            logging.info(f"Running transformation {transform}")
            # build metadata
            metadata = {
                "duration" : video_info.get("duration", 0), # used for youtube highlights
                "length" : 3000, # used for youtube summary
            }
            logging.info(f"Metadata: {metadata} for transformation {transform}")
            transformation = TransformationFactory.get_transformation_service(TranscriptionTransformation(transform))
            transformed_transcript = transformation.transform(combined_transcription, metadata=metadata)
        except Exception as e:
            logging.error(f"An error occurred during transcript adjustment or transformation: {str(e)}")
            print(json.dumps({"error": f"An error occurred: {str(e)}"}))
            raise
        finally:
            os.remove(audio_file_path)

        result = {
            "url": url,
            "title": video_info.get("title", "Unknown Title"),
            "duration": video_info.get("duration", 0),
            "service": service,
            "transcription_file_path": transcription_file_path,
            "transcript": combined_transcription,
            "transformed_transcript": transformed_transcript,
            "transform": transform
        }

        return result # todo: adjust this object type to be the same as the app.py file

if __name__ == "__main__":
    # Load environment variables from .env file
    load_dotenv()

    logs_dir = 'logs'
    os.makedirs(logs_dir, exist_ok=True)
    log_filename = os.path.join(logs_dir, f"transcription_{datetime.now().strftime('%Y-%m-%d')}.log")
    logging.basicConfig(filename=log_filename, level=logging.INFO, format='%(asctime)s %(levelname)s:%(message)s')

    listener = RabbitMQListener()
    try:
        listener.listen(process_transcription_message)
    except KeyboardInterrupt:
        logging.info("Interrupted by user")
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        print(json.dumps({"error": f"An error occurred: {str(e)}"}))
    finally:
        if listener.connection and not listener.connection.is_closed:
            listener.connection.close()
            logging.info("Connection to RabbitMQ closed")
