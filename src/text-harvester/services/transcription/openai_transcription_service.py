import logging
from openai import OpenAI
from .transcription_service import TranscriptionService

class OpenAITranscriptionService(TranscriptionService):
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def transcribe(self, audio_file_path: str, prompt: str) -> str:
        try:
            with open(audio_file_path, 'rb') as audio_file:
                logging.debug(f"Processing part {audio_file_path}")
                transcription = self.client.audio.transcriptions.create(model="whisper-1", file=audio_file, prompt=prompt)
            return transcription.text
        except Exception as e:
            logging.error(f"Error transcribing audio file: {e}")
            return ""

    def file_name_extension(self) -> str:
        return ".txt"
