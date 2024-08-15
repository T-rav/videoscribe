import logging
from groq import Groq
from .transcription_service import TranscriptionService

class GroqTranscriptionService(TranscriptionService):
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)

    def transcribe(self, audio_file_path: str, prompt: str) -> str:
        try:
            with open(audio_file_path, 'rb') as audio_file:
                logging.debug(f"Processing part {audio_file_path}")
                trimmed_prompt = self.take_last_896_chars(prompt)
                transcription = self.client.audio.transcriptions.create(
                    model="whisper-large-v3", 
                    file=audio_file,
                    response_format="json"  # Correctly specify the response format here
                )
            return transcription.text
        except Exception as e:
            logging.error(f"Error transcribing audio file: {e}")
            return ""

    def file_name_extension(self) -> str:
        return ".txt"

    def take_last_896_chars(self, input_string):
        if len(input_string) > 896:
            return input_string[-896:]
        else:
            return input_string
