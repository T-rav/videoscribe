# VideoScribe

A simple RAG tool chain used to back the `@Video Scribe` GPT able to import youtube and local video files in to an elasticsearch endpoint.

## Overview
1. Give `text-haveseter` a youtube or local file path to extract, transcribe and save to elasticsearch for retival by the `@Video Scribe` bot. 

2. Use `@Vidoe Scribe` to perform RAG like retival of transcribed video in your work with ChatGPT.

## Requirements
You will need `ffmepg` installed locally as some packages rely on it.

Additionally, you will need to a `.env` file with the correct values listed as per below to run `text-harvester`

```bash
OPENAI_API_KEY=XXX
ES_API_KEY=YYY
ES_API_ENDPOINT=ZZZ
```

TODO : Add some summary and action point extractions as per https://platform.openai.com/docs/tutorials/meeting-minutes. Feels like these belong in the GPT not as additional queries? 

TODO: 
Workflow
 + Call to function with url
  -  if found process request and inject the transcript
  -  if not found, queue request for download and return a status url, also update url if logged in (v2)
+ Basic UI with
  -  artifact list
  -  delete option
  -  refresh option
  -  add option
  -  copy button for claude 
