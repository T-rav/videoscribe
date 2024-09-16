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

