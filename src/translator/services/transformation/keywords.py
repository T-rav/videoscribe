from openai import OpenAI
from langchain import hub
from .transformation_service import TransformationService

class FormattingForKeywordsTransformation(TransformationService):
    def __init__(self, openai_api_key: str, lang_smith_api_key: str):
        self.llmOpsKey = lang_smith_api_key
        self.client = OpenAI(api_key=openai_api_key)
        
    def transform(self, transcript: str) -> str:
        chain = hub.pull("scribe-ai-format-for-keywords", include_model=True, api_key=self.llmOpsKey)
        summary = chain.invoke({"transcript": transcript})
        return summary.content