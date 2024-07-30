import subprocess
import os
import re
from enum import Enum
from abc import ABC, abstractmethod
from dotenv import load_dotenv
from openai import OpenAI
from groq import Groq
from pydub import AudioSegment
from typing import List, Optional, Iterator

# Load environment variables from .env file
load_dotenv()

class TranscriptionServiceType(Enum):
    OPENAI = "openai"
    OPENAI_VTT = "openai-vtt"
    OPENAI_SRT = "openai-srt"
    GROQ = "groq"

class TranscriptionService(ABC):
    @abstractmethod
    def transcribe(self, audio_file_path: str, prompt: str) -> str:
        pass
    def file_name_extension(self) -> str:
        pass

class OpenAITranscriptionService(TranscriptionService):
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def transcribe(self, audio_file_path: str, prompt: str) -> str:
        with open(audio_file_path, 'rb') as audio_file:
            print(f"Processing part {audio_file_path}")
            transcription = self.client.audio.transcriptions.create(model="whisper-1", file=audio_file, prompt=prompt)
        return transcription.text

    def file_name_extension(self) -> str:
        return ".txt"
    
class OpenAIVttTranscriptionService(TranscriptionService):
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def transcribe(self, audio_file_path: str, prompt: str) -> str:
        with open(audio_file_path, 'rb') as audio_file:
            print(f"Processing part {audio_file_path}")
            transcription = self.client.audio.transcriptions.create(model="whisper-1", file=audio_file, response_format="vtt", prompt=prompt)
        return transcription.replace("WEBVTT\n\n", "")

    def file_name_extension(self) -> str:
        return ".vtt"

class OpenAISrtTranscriptionService(TranscriptionService):
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def transcribe(self, audio_file_path: str, prompt: str) -> str:
        with open(audio_file_path, 'rb') as audio_file:
            print(f"Processing part {audio_file_path}")
            transcription = self.client.audio.transcriptions.create(model="whisper-1", file=audio_file, response_format="srt", prompt=prompt)
        return transcription

    def file_name_extension(self) -> str:
        return ".srt"
    
class GroqTranscriptionService(TranscriptionService):
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)

    def transcribe(self, audio_file_path: str, prompt: str) -> str:
        with open(audio_file_path, 'rb') as audio_file:
            print(f"Processing part {audio_file_path}")
            transcription = self.client.audio.transcriptions.create(model="whisper-large-v3", file=audio_file, prompt=prompt)
        return transcription.text

    def file_name_extension(self) -> str:
        return ".txt"

class TranscriptionFactory:
    # add services here
    _service_map = {
        TranscriptionServiceType.OPENAI: (OpenAITranscriptionService, "OPENAI_API_KEY"),
        TranscriptionServiceType.OPENAI_SRT: (OpenAISrtTranscriptionService, "OPENAI_API_KEY"),
        TranscriptionServiceType.OPENAI_VTT: (OpenAIVttTranscriptionService, "OPENAI_API_KEY"),
        TranscriptionServiceType.GROQ: (GroqTranscriptionService, "GROQ_API_KEY")
    }

    @staticmethod
    def get_transcription_service(service_name: TranscriptionServiceType) -> TranscriptionService:
        if service_name not in TranscriptionFactory._service_map:
            raise ValueError(f"Unsupported transcription service: {service_name}")

        service_class, api_key_env = TranscriptionFactory._service_map[service_name]
        api_key = os.getenv(api_key_env)
        if api_key is None:
            raise ValueError(f"{api_key_env} is not provided")

        return service_class(api_key)

def download_audio(url: str, path: str) -> Optional[str]:
    # Ensure the path exists
    if not os.path.exists(path):
        os.makedirs(path)

    command = [
        'yt-dlp',
        '-x',  # Extract audio
        '--audio-format', 'm4a',  # Specify audio format
        '--output', os.path.join(path, '%(title)s.%(ext)s'),  # Naming convention
        url  # YouTube URL
    ]
    # Execute the yt-dlp command
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    # Extract the file path from the stdout
    output = result.stdout
    file_path_match = re.search(r'Destination:\s+(.*\.m4a)', output)
    
    if file_path_match:
        file_path = file_path_match.group(1).strip()
        if os.path.exists(file_path) and file_path.endswith(".m4a"):
            return file_path
    
    return None  # In case no file is found

def split_audio(file_path: str, segment_length_ms: int = 600000) -> Iterator[str]:  # Default segment length: 10 minutes
    song = AudioSegment.from_file(file_path)
    parts = len(song) // segment_length_ms + 1
    base, ext = os.path.splitext(file_path)
    audio_format = ext.replace('.', '')

    for i in range(parts):
        start = i * segment_length_ms
        part = song[start:start + segment_length_ms]
        part_file_path = f"{base}_part{i}{ext}"
        if audio_format == 'm4a':
            part.export(part_file_path, format='ipod')  # Use 'ipod' codec for m4a
        else:
            part.export(part_file_path, format=audio_format)
        yield part_file_path

def transcribe_audio_segment(service: TranscriptionService, audio_file_path: str, prompt: str) -> str:
    return service.transcribe(audio_file_path, prompt)

def transcribe_audio(file_path: str, service: TranscriptionService, prompt: str) -> str:
    # Check file size first
    if os.path.getsize(file_path) > 26214400:  # If file is larger than 25MB
        transcriptions: List[str] = []
        for segment_path in split_audio(file_path):
            transcription = transcribe_audio_segment(service, segment_path, prompt)
            transcriptions.append(transcription)
            os.remove(segment_path)  # Clean up the segment
        return ' '.join(transcriptions)
    else:
        return transcribe_audio_segment(service, file_path, prompt)

# Const
path = './incoming'  # Specify the directory path where you want to save the audio file.
prompt = "My name is Travis Frisinger. I am a software engineer who blogs, streams and pod cast about my AI Adventures with Gen AI."
# Input
#url = 'https://youtube.com/live/J2MYP9Srlng'
# Testing url
url = 'https://youtu.be/Un-aZ7BO7gw'

print("Processing audio...")
if url.startswith("https://"):
    audio_file_path = download_audio(url, f'{path}/audio')
else:
    # assume it is a local file
    file_name = os.path.basename(url)
    audio_file_path = os.path.join(path, "audio", file_name)

    # Check the file extension and only convert if it's not already .m4a or .mp3
    if not (file_name.endswith(".m4a") or file_name.endswith(".mp3")):
        print("Fetching audio...")
        # Replace spaces with hyphens in the file name if not .m4a or .mp3
        file_name = file_name.replace(" ", "-")
        audio_file_path = os.path.join(path, "audio", os.path.splitext(file_name)[0] + "_audio.m4a")
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
        
        # Convert the file to M4A format
        subprocess.run(['ffmpeg', '-i', url, '-vn', '-ar', '16000', '-ac', '1', '-ab', '128k', '-f', 'ipod', audio_file_path], check=True)

print(f"Audio file is ready at {audio_file_path}")

# Embedding part
print(f"Running embeddings...")
search()

# Transcription part
if audio_file_path is not None:
    print(f"Running transcription on {audio_file_path}")
    transcription_service = TranscriptionFactory.get_transcription_service(TranscriptionServiceType.OPENAI) 
    combined_transcription = transcribe_audio(audio_file_path, transcription_service, prompt)
    
    # Derive the transcription file path by replacing the audio file extension with '_transcript.txt'
    transcription_file_path = f'{os.path.splitext(audio_file_path)[0]}_transcript{transcription_service.file_name_extension()}'.replace("audio/", "transcript/")
    
    # Ensure the directory exists
    os.makedirs(os.path.dirname(transcription_file_path), exist_ok=True)
    
    # Writing the transcription to the file
    with open(transcription_file_path, 'w', encoding='utf-8') as file:
        file.write(combined_transcription)

    os.remove(audio_file_path) # remove the audio once done with it

    print(f"Transcription written to {transcription_file_path}")
