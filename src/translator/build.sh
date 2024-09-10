#!/bin/sh

docker build -t scribe-ai-jobs-listener .

docker run -d --name scribe-ai-jobs-listener -e RABBITMQ_URL=amqp://guest:guest@localhost:5672/ -e TRANSCRIPTION_QUEUE_NAME=transcription-jobs -e TRANSCRIPTION_QUEUE_NAME_DEMO=transcription-jobs-demo scribe-ai-jobs-listener scribe-ai-jobs-listener