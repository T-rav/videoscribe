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

MISSION : Create new content from existing sources - A mixing board for content creation!

- PLAN -
1. Create Function to process files on blob storage then save the transcript back to blob storage
2. Create UI to allow for youtube or uploaded file to be processed (saved to blob storage and queued for work?)
3. Amend UI to allow for (https://scribe.koderex.dev/)
    -  artifact list
    -  delete option
    -  refresh option
    -  add option
    -  copy button for claude 
    -  simple RAG aggregation on data
4. post processing 
    - remove ads (pod cast)
    - summarize for youtube (5000 chars or less)
5. User search - index all your media then search for how to blend into new ideas for content? 
6. Channel monitoring - poll for new stuff then index it when there is new stuff
