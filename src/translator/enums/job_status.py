from enum import Enum

class JobStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"
    FAILED = "failed"