import subprocess
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Access the environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ES_API_KEY = os.getenv("ES_API_KEY")
ES_API_ENDPOINT = os.getenv("ES_API_ENDPOINT")

def download_audio(url, path):
    # Ensure the path exists
    if not os.path.exists(path):
        os.makedirs(path)
    # Construct the yt-dlp command
    audio_file_path = os.path.join(path, 'audio.mp3')  # Define the output file path
    command = [
        'yt-dlp',
        '-x',  # Extract audio
        '--audio-format', 'mp3',  # Specify audio format
        '--output', os.path.join(path, '%(title)s.%(ext)s'),  # Naming convention
        url  # YouTube URL
    ]
    # Execute the yt-dlp command
    subprocess.run(command, check=True)
    # Assuming yt-dlp names the file after the video title, you might need to find the file
    # This is a simplistic approach; for more accuracy, consider parsing yt-dlp's output
    files = os.listdir(path)
    for file in files:
        if file.endswith(".mp3"):
            return os.path.join(path, file)
    return None  # In case no file is found, which is unlikely

def transcribe_audio(audio_file_path):
    client = OpenAI(
        api_key=OPENAI_API_KEY
    )
    with open(audio_file_path, 'rb') as audio_file:
       transcription = client.audio.transcriptions.create(model="whisper-1", file=audio_file)
    return transcription.text

# Example usage
url = 'https://www.youtube.com/watch?v=Un-aZ7BO7gw'
path = './incoming'  # Specify the directory path where you want to save the audio file.
print("Fetching audio...")
audio_file_path = download_audio(url, path)
if audio_file_path:
    print(f"Running transcription on {audio_file_path}")
    transcript = transcribe_audio(audio_file_path)
    print(f"transcript: {transcript}")
else:
    print("Could not download audio.")
