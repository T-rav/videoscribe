#!/bin/sh

# Build the Docker image
docker build -t postgres .

# Run the Docker container
docker run -d --name scribe-ai-postgres-container -p 5432:5432 postgres