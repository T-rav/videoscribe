# app.py
from datetime import datetime
import json
import subprocess
import os
import re
import argparse
import logging
from services.transcription import TranscriptionServiceType, TranscriptionFactory
from pydub import AudioSegment
from typing import List, Optional, Iterator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the current date
current_date = datetime.now().strftime('%Y-%m-%d')

# Create the filename with the date
log_filename = f'transcription_{current_date}.log'

# Set up logging with the dynamic filename
logging.basicConfig(
    filename=log_filename,
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s:%(message)s'
)

def get_video_info(url: str) -> dict:
    command = [
        'yt-dlp',
        '--dump-json',
        url
    ]
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    video_info = result.stdout
    return json.loads(video_info)

def download_audio(url: str, path: str, max_length_minutes: Optional[int] = None) -> Optional[str]:
    logging.debug(f"Downloading audio from {url} to {path}")
    current_directory = os.getcwd()
    logging.debug(f"Current Directory: {current_directory}")

    if not os.path.exists(path):
        os.makedirs(path)

    command = [
        'yt-dlp',
        '-x',  # Extract audio
        '--audio-format', 'm4a',  # Specify audio format
        '--output', os.path.join(path, '%(title)s.%(ext)s'),  # Naming convention
        '--format', 'bestaudio',
        '-N', '4',  # use 4 connections
        url  # YouTube URL
    ]

    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        output = result.stdout
        logging.debug(f"yt-dlp output: {output}")
        file_path_match = re.search(r'Destination:\s+(.*\.m4a)', output)
        
        if file_path_match:
            file_path = file_path_match.group(1).strip()
            logging.debug(f"File path found: {file_path}")
            if os.path.exists(file_path) and file_path.endswith(".m4a"):
                logging.debug(f"File exists: {file_path}")
                if max_length_minutes:
                    logging.debug(f"Trimming audio file: {file_path}")
                    max_length_seconds = max_length_minutes * 60
                    trimmed_file_path = file_path.replace('.m4a', '_trimmed.m4a')
                    subprocess.run(['ffmpeg', '-i', file_path, '-ss', '00:00:00', '-t', str(max_length_seconds), trimmed_file_path], check=True)
                    os.remove(file_path)
                    return trimmed_file_path
                return file_path
            else:
                logging.error(f"File does not exist or is not a .m4a file: {file_path}")
        else:
            logging.error("File path not found in yt-dlp output")
    except subprocess.CalledProcessError as e:
        logging.error(f"Error: {e.stderr}")
    
    return None

def split_audio(file_path: str, segment_length_ms: int = 600000) -> Iterator[str]:
    song = AudioSegment.from_file(file_path)
    parts = len(song) // segment_length_ms + 1
    base, ext = os.path.splitext(file_path)
    audio_format = ext.replace('.', '')

    for i in range(parts):
        start = i * segment_length_ms
        part = song[start:start + segment_length_ms]
        part_file_path = f"{base}_part{i}{ext}"
        if audio_format == 'm4a':
            part.export(part_file_path, format='ipod')
        else:
            part.export(part_file_path, format=audio_format)
        yield part_file_path

def transcribe_audio_segment(service, audio_file_path: str, prompt: str) -> str:
    return service.transcribe(audio_file_path, prompt)

def transcribe_audio(file_path: str, service, prompt: str) -> str:
    if os.path.getsize(file_path) > 26214400:
        transcriptions: List[str] = []
        system_prompt = prompt
        for segment_path in split_audio(file_path):
            transcription = transcribe_audio_segment(service, segment_path, system_prompt)
            system_prompt = f"{transcription} {prompt}"
            transcriptions.append(transcription)
            os.remove(segment_path)
        return ' '.join(transcriptions)
    else:
        return transcribe_audio_segment(service, file_path, prompt)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Transcribe audio from a video or local file.')
    parser.add_argument('url', type=str, help='The URL of the video or path to the local file.')
    parser.add_argument('--path', type=str, default='./incoming', help='The directory path to save the audio file.')
    parser.add_argument('--max_length_minutes', type=int, default=None, help='Maximum length of the video in minutes.')
    parser.add_argument('--prompt', type=str, default=None, help='Prompt for the transcription service.')
    parser.add_argument('--service', type=str, choices=[service.value for service in TranscriptionServiceType], default='groq', help='The transcription service to use.')

    args = parser.parse_args()

    logging.debug("Processing audio...")

    video_info = get_video_info(args.url)
    title = video_info.get("title", "Unknown Title")
    duration = video_info.get("duration", 0)
    
    if args.url.startswith("https://"):
        audio_file_path = download_audio(args.url, f'{args.path}/audio', max_length_minutes=args.max_length_minutes)
    else:
        file_name = os.path.basename(args.url)
        audio_file_path = os.path.join(args.path, "audio", file_name)

        if not (file_name.endswith(".m4a") or file_name.endswith(".mp3")):
            logging.debug("Fetching audio...")
            file_name = file_name.replace(" ", "-")
            audio_file_path = os.path.join(args.path, "audio", os.path.splitext(file_name)[0] + "_audio.m4a")
            os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
            subprocess.run(['ffmpeg', '-i', args.url, '-vn', '-ar', '16000', '-ac', '1', '-ab', '128k', '-f', 'ipod', audio_file_path], check=True)

    logging.debug(f"Audio file is ready at {audio_file_path}")

    if audio_file_path is not None:
        logging.debug(f"Running transcription on {audio_file_path}")
        transcription_service = TranscriptionFactory.get_transcription_service(TranscriptionServiceType(args.service)) 
        combined_transcription = transcribe_audio(audio_file_path, transcription_service, args.prompt)
        
        transcription_file_path = f'{os.path.splitext(audio_file_path)[0]}_transcript{transcription_service.file_name_extension()}'.replace("audio/", "transcript/")
        os.makedirs(os.path.dirname(transcription_file_path), exist_ok=True)
        
        with open(transcription_file_path, 'w', encoding='utf-8') as file:
            file.write(combined_transcription)

        result = {
            "url": args.url,
            "title": title,
            "duration": duration,
            "service": args.service,
            "transcription_file_path": transcription_file_path,
            "transcript": combined_transcription
        }

        os.remove(audio_file_path)

        print(json.dumps(result))
