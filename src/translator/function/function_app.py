import azure.functions as func
import datetime
import json
import logging
import os  # Add this import to access environment variables

app = func.FunctionApp()

# Load the connection string from environment variables
path = os.getenv("AZURE_STORAGE_PATH")

@app.blob_trigger(arg_name="request", path=path,
                  connection="BLOB_STORAGE_CONNECTION_STRING")  # Update this line
def ProcessTransribeRequest(request: func.InputStream):
    logging.info(f"Python blob trigger function processed blob"
                f"Name: {request.name}")
    content = request.read()
    
    try:
        # Parse the content into a dictionary
        transcription_message = json.loads(content)
        
        # Log the parsed content
        logging.info(f"Parsed Transcription Message: {transcription_message}")
    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse JSON content: {e} for {request.name}")
        return

    # todo : now process through the transcription service