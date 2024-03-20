import subprocess
import os
import os
from dotenv import load_dotenv
from openai import OpenAI
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Access the environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ES_API_KEY = os.getenv("ES_API_KEY")
ES_API_ENDPOINT = os.getenv("ES_API_ENDPOINT")

def download_audio(url, path):
    if "youtube" in url:
        return download_audio_yt(url, path)
    elif "vimeo" in url:
        print("Just use the wondershare download tool!")
        return None
    else:
        raise ValueError("URL must be from YouTube or Vimeo.")

def download_audio_yt(url, path):
    yt = YouTube(url)
    video_stream = yt.streams.get_lowest_resolution()
    video_file_path = video_stream.download(output_path=path)
    audio_file_path = video_file_path.replace(".mp4", "_audio.wav")
    # Use ffmpeg to extract audio
    subprocess.run(['ffmpeg', '-i', video_file_path, '-vn', '-ar', '16000', '-ac', '1', '-ab', '192k', '-f', 'wav', audio_file_path], check=True)
    # Clean up the video file after extracting the audio
    os.remove(video_file_path)
    return audio_file_path

def transcribe_audio(audio_file_path):
    client = OpenAI(
        api_key=OPENAI_API_KEY
    )
    with open(audio_file_path, 'rb') as audio_file:
       transcription = client.audio.transcriptions.create(model="whisper-1", file=audio_file)
    return transcription.text

# Const
path = './incoming/'  # Specify the directory path where you want to save the audio file.

# Input
#url = 'https://www.youtube.com/watch?v=Un-aZ7BO7gw'
url = './incoming/The Gen AI payoff in 2024.mp4'

print("Fetching audio...")
if url.startswith("https://"):
    audio_file_path = download_audio(url, path)
else:
    # assume it is a local file
    audio_file_path = url.replace(".mp4", "_audio.wav").replace(" ","-")
    subprocess.run(['ffmpeg', '-i', url, '-vn', '-ar', '16000', '-ac', '1', '-ab', '192k', '-f', 'wav', audio_file_path], check=True)

if audio_file_path is not None:
    print(f"Running transcription on {audio_file_path}")
    transcribe_audio(audio_file_path)
