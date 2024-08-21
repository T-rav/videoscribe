from abc import ABC, abstractmethod
from enum import Enum

class TranscriptionTransformation(Enum):
    NONE = "none"
    SUMMARIZE = "summarize"
    FORMATTING = "formatting"
    REMOVEFILLERWORDS = "removefillerwords"
    PARAGRAPHS = "paragraphs"
    KEYWORDS = "keywords"
    YOUTUBEHIGHLIGHTS = "youtubehighlights"
    YOUTUBESUMMARY = "youtubesummary"
    TRANSLATION = "translation"
    IMAGE = "image"

class TransformationService(ABC):
    @abstractmethod
    def transform(self, transcript: str) -> str:
        pass
