# app.py
import argparse
import logging
import os
import json
from dotenv import load_dotenv
from services.audio.audio_service import AudioService
from services.audio.audio_downloader import AudioDownloader
from services.audio.file_handler import FileHandler
from services.transcription import TranscriptionServiceType, TranscriptionFactory

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(filename='transcription.log', level=logging.DEBUG, format='%(asctime)s %(levelname)s:%(message)s')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Transcribe audio from a video or local file.')
    parser.add_argument('url', type=str, help='The URL of the video or path to the local file.')
    parser.add_argument('--path', type=str, default='./incoming', help='The directory path to save the audio file.')
    parser.add_argument('--max_length_minutes', type=int, default=None, help='Maximum length of the video in minutes.')
    parser.add_argument('--prompt', type=str, default=None, help='Prompt for the transcription service.')
    parser.add_argument('--service', type=str, choices=[service.value for service in TranscriptionServiceType], default='groq', help='The transcription service to use.')

    args = parser.parse_args()

    logging.debug("Processing audio...")

    if args.url.startswith("https://"):
        video_info = AudioDownloader.get_video_info(args.url)
        audio_file_path = AudioDownloader.download_audio(args.url, f'{args.path}/audio', max_length_minutes=args.max_length_minutes)
    else:
        video_info = {"title": os.path.basename(args.url), "duration": 0}
        audio_file_path = FileHandler.handle_local_file(args.url, args.path)

    logging.debug(f"Audio file is ready at {audio_file_path}")

    if audio_file_path is not None:
        logging.debug(f"Running transcription on {audio_file_path}")
        transcription_service = TranscriptionFactory.get_transcription_service(TranscriptionServiceType(args.service)) 
        combined_transcription = AudioService.transcribe_audio(audio_file_path, transcription_service, args.prompt)
        
        transcription_file_path = f'{os.path.splitext(audio_file_path)[0]}_transcript{transcription_service.file_name_extension()}'.replace("audio/", "transcript/")
        os.makedirs(os.path.dirname(transcription_file_path), exist_ok=True)
        
        with open(transcription_file_path, 'w', encoding='utf-8') as file:
            file.write(combined_transcription)

        # Adjust transcript if necessary
        combined_transcription, transcription_file_path = AudioService.adjust_transcript_if_needed(transcription_file_path, TranscriptionServiceType(args.service))

        result = {
            "url": args.url,
            "title": video_info.get("title", "Unknown Title"),
            "duration": video_info.get("duration", 0),
            "service": args.service,
            "transcription_file_path": transcription_file_path,  # Return adjusted file if applicable
            "transcript": combined_transcription  # Return the adjusted transcript text
        }

        os.remove(audio_file_path)

        print(json.dumps(result))
