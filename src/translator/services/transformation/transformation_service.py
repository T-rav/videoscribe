from abc import ABC, abstractmethod
from enum import Enum

class TranscriptionTransformation(Enum):
    NONE = "none"
    SUMMARIZE = "summarize"
    FORMATTING = "formatting"
    REMOVEFILLERWORDS = "removefillerwords"
    PARAGRAPHS = "paragraphs"
    KEYWORDS = "keywords"
    TRANSLATION = "translation"
    IMAGE = "image"

class TransformationService(ABC):
    @abstractmethod
    def transform(self, transcript: str) -> str:
        pass
