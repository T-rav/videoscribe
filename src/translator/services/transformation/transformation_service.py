from abc import ABC, abstractmethod

class TransformationService(ABC):
    @abstractmethod
    def transform(self, transcript: str, metadata: dict = None) -> str:
        pass
