from langchain_elasticsearch import ElasticsearchStore
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
import hashlib
from elasticsearch import Elasticsearch
from langchain_text_splitters import CharacterTextSplitter
import os

print(f"Running embeddings...")

ES_API_ENDPOINT = "http://localhost:9200" 
#ES_API_ENDPOINT = os.getenv("ES_API_ENDPOINT")
ES_API_USER = os.getenv("ES_API_USER")
ES_API_PASS = os.getenv("ES_API_PASS")

es = Elasticsearch([ES_API_ENDPOINT])

src = "./incoming/transcript/The-Gen-AI-payoff-in-2024_audio_transcript.txt"

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