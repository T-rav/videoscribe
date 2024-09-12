from pydantic import BaseModel

class MediaMessage(BaseModel):
    jobId: str
    title: str
    duration: int
    blobUrl: str
    status: str
