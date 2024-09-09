#!/bin/sh

docker build -t rabbitmq-listener .

docker run -d --name rabbitmq-listener -e RABBITMQ_URL=amqp://guest:guest@localhost:5672/ -e TRANSCRIPTION_QUEUE_NAME=transcription-jobs -e TRANSCRIPTION_QUEUE_NAME_DEMO=transcription-jobs-demo rabbitmq-listener rabbitmq-listener