from enum import Enum

class TranscriptionServiceType(Enum):
    OPENAI = "openai"
    OPENAI_VTT = "openai-vtt"
    OPENAI_SRT = "openai-srt"
    GROQ = "groq"
