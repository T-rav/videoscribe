from pydantic import BaseModel
from typing import Optional

class TranscriptionResult(BaseModel):
    jobId: str
    transcript: str
    transformed: Optional[str] = None
    status: str
    error: Optional[str] = None
