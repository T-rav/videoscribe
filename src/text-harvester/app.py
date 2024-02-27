from pytube import YouTube
import speech_recognition as sr
import subprocess
import os  # Import the os module

def download_audio(url, path):
    yt = YouTube(url)
    video_stream = yt.streams.get_lowest_resolution()
    video_file_path = video_stream.download(output_path=path)
    audio_file_path = video_file_path.replace(".mp4", "_audio.wav")
    # Use ffmpeg to extract audio
    subprocess.run(['ffmpeg', '-i', video_file_path, '-vn', '-ar', '16000', '-ac', '1', '-ab', '192k', '-f', 'wav', audio_file_path], check=True)
    # Clean up the video file after extracting the audio
    os.remove(video_file_path)  # Delete the video file
    return audio_file_path

def transcribe_audio(audio_file_path):
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_file_path) as source:
        audio_data = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio_data)
            print(f"Transcription: {text}")
        except sr.UnknownValueError:
            print("Google Speech Recognition could not understand audio")
        except sr.RequestError as e:
            print(f"Could not request results from Google Speech Recognition service; {e}")

# Example usage
url = 'https://www.youtube.com/watch?v=Un-aZ7BO7gw'
path = './incoming'  # Specify the directory path where you want to save the audio file.
print("Fetching audio...")
audio_file_path = download_audio(url, path)
print(f"Running transcription on {audio_file_path}")
transcribe_audio(audio_file_path)
