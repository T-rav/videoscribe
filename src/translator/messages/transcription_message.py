from pydantic import BaseModel
from typing import Optional
from enums.transcription_service_type import TranscriptionServiceType
from enums.transcription_transformation import TranscriptionTransformation

class TranscriptionMessage(BaseModel):
    jobId: str
    transcriptionType: TranscriptionServiceType
    transform: TranscriptionTransformation
    isFile: bool
    content: str
    userId: str
    mimeType: Optional[str] = None
    fileName: Optional[str] = None