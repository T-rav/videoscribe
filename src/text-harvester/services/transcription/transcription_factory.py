import os
from .transcription_service import TranscriptionService, TranscriptionServiceType
from .openai_transcription_service import OpenAITranscriptionService
from .openai_srt_transcription_service import OpenAISrtTranscriptionService
from .openai_vtt_transcription_service import OpenAIVttTranscriptionService
from .groq_transcription_service import GroqTranscriptionService

class TranscriptionFactory:
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
