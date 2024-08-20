from openai import OpenAI
from langsmith import Client, client
from .transformation_service import TransformationService

class SummarizeTransformation(TransformationService):
    def __init__(self, openai_api_key: str, lang_smith_api_key: str):
        self.client = OpenAI(api_key=openai_api_key)
        self.prompts = Client(api_key=lang_smith_api_key)
        
    def transform(self, transcript: str) -> str:
        chain = client.pull_prompt("scribe-ai-summary", include_model=True)
        summary = chain.invoke({"transcript": transcript})
        return summary