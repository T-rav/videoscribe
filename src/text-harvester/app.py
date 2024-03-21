import subprocess
import os
from dotenv import load_dotenv
from langchain_text_splitters import CharacterTextSplitter
from openai import OpenAI
from pydub import AudioSegment
from langchain_elasticsearch import ElasticsearchStore
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
import hashlib
from elasticsearch import Elasticsearch


# Load environment variables from .env file
load_dotenv()

# Access the environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ES_API_ENDPOINT = "http://localhost:9200" 
#ES_API_ENDPOINT = os.getenv("ES_API_ENDPOINT")
ES_API_USER = os.getenv("ES_API_USER")
ES_API_PASS = os.getenv("ES_API_PASS")

def download_audio(url, path):
    # Ensure the path exists
    if not os.path.exists(path):
        os.makedirs(path)

    command = [
        'yt-dlp',
        '-x',  # Extract audio
        '--audio-format', 'mp3',  # Specify audio format
        '--output', os.path.join(path, '%(title)s.%(ext)s'),  # Naming convention
        url  # YouTube URL
    ]
    # Execute the yt-dlp command
    subprocess.run(command, check=True)
    # Assuming yt-dlp names the file after the video title, you might need to find the file
    # This is a simplistic approach; for more accuracy, consider parsing yt-dlp's output
    files = os.listdir(path)
    for file in files:
        if file.endswith(".mp3"):
            return os.path.join(path, file)
    return None  # In case no file is found, which is unlikely

def split_audio(file_path, segment_length_ms=600000):  # Default segment length: 10 minutes
    song = AudioSegment.from_file(file_path)
    parts = len(song) // segment_length_ms + 1
    base, ext = os.path.splitext(file_path)
    for i in range(parts):
        start = i * segment_length_ms
        part = song[start:start + segment_length_ms]
        part_file_path = f"{base}_part{i}{ext}"
        part.export(part_file_path, format=ext.replace('.', ''))
        yield part_file_path

def transcribe_audio_segment(api_key, audio_file_path):
    client = OpenAI(api_key=api_key)
    with open(audio_file_path, 'rb') as audio_file:
        print(f"Processing part {audio_file_path}")
        transcription = client.audio.transcriptions.create(model="whisper-1", file=audio_file)
    return transcription.text

def transcribe_audio(file_path, api_key):
    # Check file size first
    if os.path.getsize(file_path) > 26214400:  # If file is larger than 25MB
        transcriptions = []
        for segment_path in split_audio(file_path):
            transcription = transcribe_audio_segment(api_key, segment_path)
            transcriptions.append(transcription)
            os.remove(segment_path)  # Clean up the segment
        return ' '.join(transcriptions)
    else:
        return transcribe_audio_segment(api_key, file_path)

# Const
path = './incoming'  # Specify the directory path where you want to save the audio file.
# Input
#src = './incoming/The Gen AI payoff in 2024.mp4'
src = 'https://www.youtube.com/watch?v=Un-aZ7BO7gw'
url = src


print("Fetching audio...")
if url.startswith("https://"):
    audio_file_path = download_audio(url, f'{path}/audio')
else:
    # assume it is a local file
    file_name = os.path.basename(url)
    audio_file_path = os.path.join(path, "audio", file_name.replace(".mp4", "_audio.mp3").replace(" ","-"))
    # Ensure the directory exists
    os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
    subprocess.run(['ffmpeg', '-i', url, '-vn', '-ar', '16000', '-ac', '1', '-ab', '128k', '-f', 'mp3', audio_file_path], check=True)

if audio_file_path is not None:
    print(f"Running transcription on {audio_file_path}")
    combined_transcription = transcribe_audio(audio_file_path, OPENAI_API_KEY)
    # Specify the file path where you want to save the transcription
    transcription_file_path = f'{audio_file_path.replace(".mp3", "_transcript.txt").replace("audio/", "transcript/")}'
    
    # Ensure the directory exists
    os.makedirs(os.path.dirname(transcription_file_path), exist_ok=True)
    
    # Writing the transcription to the file
    with open(transcription_file_path, 'w', encoding='utf-8') as file:
        file.write(combined_transcription)

    print(f"Transcription written to {transcription_file_path}")


    print(f"Running embeddings...")

    es = Elasticsearch([ES_API_ENDPOINT])

    def document_exists(index_name, url, doc_id):
        query = {
            "query": {
                "bool": {
                "must": [
                    {
                    "match": {
                        "metadata.source": src
                    }
                    },
                    {
                    "match": {
                        "metadata.source_transcript_sha256": doc_id
                    }
                    }
                ]
                }
            },
            "size": 1
        }

        response = es.search(index=index_name, body=query)
        return response['hits']['total']['value'] > 0

    def generate_document_id(file_path):
        """Calculate the SHA-256 hash of a file's contents."""
        sha256_hash = hashlib.sha256()
        # Open the file in binary mode to ensure correct handling of all file types
        with open(file_path, "rb") as file:
            # Read and update hash in chunks of 4K
            for byte_block in iter(lambda: file.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    loader = TextLoader(transcription_file_path)
    documents = loader.load()
    text_splitter = CharacterTextSplitter(chunk_size=100, chunk_overlap=0)
    docs = text_splitter.split_documents(documents)
    embeddings = OpenAIEmbeddings()

    db = ElasticsearchStore(
            es_url=ES_API_ENDPOINT,
            index_name="test_rag_index",
            embedding=embeddings,
            # es_user=ES_API_USER,
            # es_password=ES_API_PASS
        )
    
    doc_id = generate_document_id(transcription_file_path)
    if not document_exists("test_rag_index", url, doc_id):
        for doc in docs:
            doc.metadata["source"] = url
            doc.metadata["source_transcript_sha256"] = doc_id
        print(f"Indexed document with ID: {doc_id}")
    else:
        print(f"Document with ID: {doc_id} and source {url} already exists. Skipping.")
        
    db.add_documents(docs);
    db.client.indices.refresh(index="test_rag_index")

    query = "What is GPT With Me?"
    results = db.similarity_search(query)
    print(results)