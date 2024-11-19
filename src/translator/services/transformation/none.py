from .transformation_service import TransformationService

class NoneTransformation(TransformationService):
    def transform(self, transcript: str, metadata: dict = None) -> str:
        return transcript