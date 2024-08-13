from abc import ABC, abstractmethod
from enum import Enum

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
