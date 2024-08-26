from openai import OpenAI
from langsmith import Client
from langchain import hub
from .transformation_service import TransformationService

class FormattingForYoutubeHighlightsTransformation(TransformationService):
    def __init__(self, openai_api_key: str, lang_smith_api_key: str):
        self.llmOpsKey = lang_smith_api_key
        self.client = OpenAI(api_key=openai_api_key)
        
    def transform(self, transcript: str, metadata: dict) -> str:
        chain = hub.pull("scribe-ai-format-youtube-highlights-v2", include_model=True, api_key=self.llmOpsKey)
        summary = chain.invoke({"transcript": transcript, "duration": self.format_duration(metadata.get("duration", 0))})
        return summary.content
    
    def format_duration(self, seconds: int) -> str:
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60

        time_string = ':'.join(f'{unit:02}' for unit in (h, m, s))

        if h > 0:
            return f"{time_string} hours"
        elif m > 0:
            return f"{time_string} minutes"
        else:
            return f"{time_string} seconds"
