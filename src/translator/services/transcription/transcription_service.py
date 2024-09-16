from abc import ABC, abstractmethod

class TranscriptionService(ABC):
    @abstractmethod
    def transcribe(self, audio_file_path: str, prompt: str) -> str:
        pass

    def file_name_extension(self) -> str:
        pass
