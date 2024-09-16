#!/bin/sh

# Stop the PostgreSQL Docker container
docker stop scribe-ai-postgres-container

# Stop the Azurite Docker container
docker stop azurite-container