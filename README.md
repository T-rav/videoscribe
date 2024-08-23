# Scribe AI

Transform the way you consume videos. Whether it's a lecture, a meeting, or a video communication from your child's school, our tool empowers you to quickly understand and extract the most important information.

With options to summarize, highlight key points, or format the content for better readability, you can now digest hours of video in just minutes.

Perfect for busy professionals, students, parents, or anyone looking to maximize the value of video content.

## Overview

### UI
A React front-end that provides a drag-and-drop zone for local files or a URL input for YouTube, Google Drive, or Vimeo links.

![image](https://github.com/user-attachments/assets/56230592-f1a0-47d4-bbbf-78187c3137a6)

The Gen AI component is the `Enhancements` dropdown, which transforms the transcript into the desired format for quicker consumption.

### API
A Node.js back-end that provides authentication and transcript endpoints, along with rate-limiting middleware for both authorized and non-authorized users.

### Translator
The Python script where it all began. This script handles both translation and transformation tasks. It is invoked by the API in-process, with a future plan to move it to respond to Blob Storage files in a queue.

This component includes Speech-to-Text conversion and related transformations, leveraging the LangSmith repository of prompts.

### Util
A set of simple scripts to support my multimodal, prompt-driven workflow when collaborating with ChatGPT. It allows me to concatenate all the code for a project to feed into a chat for modifications. Additionally, I can feed in design images and request code updates during the conversation with ChatGPT.

## Setup

### UI
Create a `.env` file in `ui/scribe` with the following keys:

1. `REACT_APP_GOOGLE_CLIENT_ID` - As per the Google Console
2. `REACT_APP_API_BASE_URL` - As per the API project

### API
Create a `.env` file in `api` with the following keys:

1. `LOG_LEVEL` - For the logger, default to `debug`
2. `LANG_SMITH_API_KEY` - From LangSmith
3. `SESSION_SECRET` - A custom value
4. `GOOGLE_CLIENT_ID` - From Google Console
5. `GOOGLE_CLIENT_SECRET` - From Google Console
6. `AUTHORIZED_RATE_WINDOW` - A good default is `1hr`
7. `AUTHORIZED_RATE_LIMIT` - A good default is `10`
8. `UNAUTHORIZED_RATE_WINDOW` - A good default is `24hr`
9. `UNAUTHORIZED_RATE_LIMIT` - A good default is `5`
10. `JWT_SECRET` - A custom value
11. `REACT_APP_API_BASE_URL` - As per the project, e.g., `http://localhost:3001`

### Translator
Create a `.env` file in `translator` with the following keys:

1. `OPENAI_API_KEY` - As per OpenAI
2. `GROQ_API_KEY` - As per Groq
3. `LANGCHAIN_TRACING_V2` - Set to `true`
4. `LANGCHAIN_ENDPOINT` - Set to `https://api.smith.langchain.com`
5. `LANGCHAIN_API_KEY` - As per LangSmith
6. `LANGCHAIN_PROJECT` - Your LangSmith project name
