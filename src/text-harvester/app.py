import subprocess
import os
import re
from dotenv import load_dotenv
from openai import OpenAI
from pydub import AudioSegment

# Load environment variables from .env file
load_dotenv()

# Access the environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def download_audio(url, path):
    # Ensure the path exists
    if not os.path.exists(path):
        os.makedirs(path)

    command = [
        'yt-dlp',
        '-x',  # Extract audio
        '--audio-format', 'mp3',  # Specify audio format
        '--output', os.path.join(path, '%(title)s.%(ext)s'),  # Naming convention
        url  # YouTube URL
    ]
    # Execute the yt-dlp command
    result = subprocess.run(command, check=True, capture_output=True, text=True)
     # Extract the file path from the stdout
    output = result.stdout
    file_path_match = re.search(r'Destination:\s+(.*\.mp3)', output)
    
    if file_path_match:
        file_path = file_path_match.group(1).strip()
        if os.path.exists(file_path) and file_path.endswith(".mp3"):
            return file_path
    
    return None  # In case no file is found

def split_audio(file_path, segment_length_ms=600000):  # Default segment length: 10 minutes
    song = AudioSegment.from_file(file_path)
    parts = len(song) // segment_length_ms + 1
    base, ext = os.path.splitext(file_path)
    for i in range(parts):
        start = i * segment_length_ms
        part = song[start:start + segment_length_ms]
        part_file_path = f"{base}_part{i}{ext}"
        part.export(part_file_path, format=ext.replace('.', ''))
        yield part_file_path

def transcribe_audio_segment(api_key, audio_file_path):
    client = OpenAI(api_key=api_key)
    with open(audio_file_path, 'rb') as audio_file:
        print(f"Processing part {audio_file_path}")
        transcription = client.audio.transcriptions.create(model="whisper-1", file=audio_file)
    return transcription.text

def transcribe_audio(file_path, api_key):
    # Check file size first
    if os.path.getsize(file_path) > 26214400:  # If file is larger than 25MB
        transcriptions = []
        for segment_path in split_audio(file_path):
            transcription = transcribe_audio_segment(api_key, segment_path)
            transcriptions.append(transcription)
            os.remove(segment_path)  # Clean up the segment
        return ' '.join(transcriptions)
    else:
        return transcribe_audio_segment(api_key, file_path)

# Const
path = './incoming'  # Specify the directory path where you want to save the audio file.
# Input
#url = './GMT20240709-170350_Recording.m4a'
url = 'https://youtube.com/live/Nf9-0ARkQrA'
#url = 'https://www.youtube.com/watch?v=jGCvY4gNnA8'

print("Fetching audio...")
if url.startswith("https://"):
    audio_file_path = download_audio(url, f'{path}/audio')
else:
    # assume it is a local file
    file_name = os.path.basename(url)
    audio_file_path = os.path.join(path, "audio", file_name.replace(".mp4", "_audio.mp3").replace(" ","-"))
    # m4a - zoom
    if url.endswith(".m4a"):
        audio_file_path = os.path.join(path, "audio", file_name.replace(".m4a", "_audio.mp3").replace(" ","-"))

    # Ensure the directory exists
    os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
    subprocess.run(['ffmpeg', '-i', url, '-vn', '-ar', '16000', '-ac', '1', '-ab', '128k', '-f', 'mp3', audio_file_path], check=True)

if audio_file_path is not None:
    print(f"Running transcription on {audio_file_path}")
    combined_transcription = transcribe_audio(audio_file_path, OPENAI_API_KEY)
    # Specify the file path where you want to save the transcription
    transcription_file_path = f'{audio_file_path.replace(".mp3", "_transcript.txt").replace("audio/", "transcript/")}'
    
    # Ensure the directory exists
    os.makedirs(os.path.dirname(transcription_file_path), exist_ok=True)
    
    # Writing the transcription to the file
    with open(transcription_file_path, 'w', encoding='utf-8') as file:
        file.write(combined_transcription)

    print(f"Transcription written to {transcription_file_path}")
