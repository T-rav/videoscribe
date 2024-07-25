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

def split_audio(file_path, segment_length_ms=600000):  # Default segment length: 10 minutes
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
url = './incoming/audio/Building Domain-Specific Copilots.mp3'
#url = 'https://youtube.com/live/Nf9-0ARkQrA'
#url = 'https://www.youtube.com/watch?v=jGCvY4gNnA8'

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

# Transcription part
if audio_file_path is not None:
    print(f"Running transcription on {audio_file_path}")
    combined_transcription = transcribe_audio(audio_file_path, OPENAI_API_KEY)
    
    # Derive the transcription file path by replacing the audio file extension with '_transcript.txt'
    transcription_file_path = f'{os.path.splitext(audio_file_path)[0]}_transcript.txt'.replace("audio/", "transcript/")
    
    # Ensure the directory exists
    os.makedirs(os.path.dirname(transcription_file_path), exist_ok=True)
    
    # Writing the transcription to the file
    with open(transcription_file_path, 'w', encoding='utf-8') as file:
        file.write(combined_transcription)

    print(f"Transcription written to {transcription_file_path}")