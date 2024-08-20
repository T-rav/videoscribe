import argparse
from datetime import datetime
import logging
import os
import json
from dotenv import load_dotenv
from services.audio.audio_service import AudioService
from services.audio.audio_downloader import AudioDownloader
from services.audio.file_handler import FileHandler
from services.transcription import TranscriptionServiceType, TranscriptionFactory
from pydub import AudioSegment

from services.transformation import TranscriptionTransformation
from services.transformation.transformation_factory import TransformationFactory

def get_audio_duration(file_path: str) -> int:
    audio = AudioSegment.from_file(file_path)
    duration_seconds = len(audio) / 1000  # pydub returns length in milliseconds
    return duration_seconds

def main():
    # Load environment variables from .env file
    load_dotenv()

    # Create logs directory if it doesn't exist
    logs_dir = 'logs'
    os.makedirs(logs_dir, exist_ok=True)

    # Generate a log file name with the current date
    log_filename = os.path.join(logs_dir, f"transcription_{datetime.now().strftime('%Y-%m-%d')}.log")

    # Configure logging with the date in the file name
    logging.basicConfig(filename=log_filename, level=logging.DEBUG, format='%(asctime)s %(levelname)s:%(message)s')

    parser = argparse.ArgumentParser(description='Transcribe audio from a video or local file.')
    parser.add_argument('url', type=str, help='The URL of the video or path to the local file.')
    parser.add_argument('--transform', type=str, choices=[transform.value for transform in TranscriptionTransformation], default='none', help='The transform to perform on the transcript.')
    parser.add_argument('--path', type=str, default='./incoming', help='The directory path to save the audio file.')
    parser.add_argument('--max_length_minutes', type=int, default=None, help='Maximum length of the video in minutes.')
    parser.add_argument('--prompt', type=str, default=None, help='Prompt for the transcription service.')
    parser.add_argument('--service', type=str, choices=[service.value for service in TranscriptionServiceType], default='groq', help='The transcription service to use.')

    args = parser.parse_args()

    logging.info("Processing audio...")

    if args.url.startswith("https://drive.google.com"):
        audio_file_path = AudioDownloader.download_google_drive_video(args.url, args.path, max_length_minutes=args.max_length_minutes)
        video_info = {"title": "Google Drive Video", "duration": get_audio_duration(audio_file_path)}  # Google Drive doesn't give video info easily
    elif "vimeo.com" in args.url:
        video_info = AudioDownloader.get_video_info(args.url)
        audio_file_path = AudioDownloader.download_vimeo_video(args.url, f'{args.path}/audio', max_length_minutes=args.max_length_minutes)
    elif args.url.startswith("https://"):
        video_info = AudioDownloader.get_video_info(args.url)
        audio_file_path = AudioDownloader.download_audio(args.url, f'{args.path}/audio', max_length_minutes=args.max_length_minutes)
    else:
        logging.info("Processing file...")
        audio_file_path = FileHandler.handle_local_file(args.url, args.path)
        video_info = {"title": os.path.basename(args.url), "duration": get_audio_duration(audio_file_path)}

    logging.info(f"Audio file is ready at {audio_file_path}")

    if audio_file_path is not None:
        logging.info(f"Running transcription on {audio_file_path}")
        transcription_service = TranscriptionFactory.get_transcription_service(TranscriptionServiceType(args.service)) 
        combined_transcription = AudioService.transcribe_audio(audio_file_path, transcription_service, args.prompt)
        
        transcription_file_path = f'{os.path.splitext(audio_file_path)[0]}_transcript{transcription_service.file_name_extension()}'.replace("audio/", "transcript/")
        os.makedirs(os.path.dirname(transcription_file_path), exist_ok=True)
        
        logging.info(f"Writing transcript to {transcription_file_path}")
        with open(transcription_file_path, 'w', encoding='utf-8') as file:
            file.write(combined_transcription)

        try:
            # Adjust transcript if necessary
            logging.info("Adjusting transcript timings if needed...")
            combined_transcription, transcription_file_path = AudioService.adjust_transcript_if_needed(transcription_file_path, TranscriptionServiceType(args.service))

            # Run the transformation
            logging.info(f"Running transformation {args.transform}")
            transformation = TransformationFactory.get_transformation_service(TranscriptionTransformation(args.transform))
            transformed_transcript = transformation.transform(combined_transcription)
        except Exception as e:
            logging.error(f"An error occurred during transcript adjustment or transformation: {str(e)}")
            print(json.dumps({"error": f"An error occurred: {str(e)}"}))
            raise

        result = {
            "url": args.url,
            "title": video_info.get("title", "Unknown Title"),
            "duration": video_info.get("duration", 0),
            "service": args.service,
            "transcription_file_path": transcription_file_path,
            "transcript": combined_transcription,
            "transformed_transcript": transformed_transcript,
            "transform": args.transform
        }

        os.remove(audio_file_path)

        print(json.dumps(result))

if __name__ == "__main__":
    main()
