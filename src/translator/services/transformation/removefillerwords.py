from openai import OpenAI
from langsmith import Client
from langchain import hub
from .transformation_service import TransformationService

class FormattingForFillerWordsTransformation(TransformationService):
    def __init__(self, openai_api_key: str, lang_smith_api_key: str):
        self.llmOpsKey = lang_smith_api_key
        self.client = OpenAI(api_key=openai_api_key)
        
    def transform(self, transcript: str, metadata: dict) -> str:
        chain = hub.pull("scribe-ai-format-for-filler-words", include_model=True, api_key=self.llmOpsKey)
        summary = chain.invoke({"transcript": transcript})
        return summary.content