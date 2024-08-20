
from .transformation_service import TransformationService

class NoneTransformation(TransformationService):
    def transform(self, transcript: str) -> str:
        return transcript