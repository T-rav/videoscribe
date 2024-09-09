#!/bin/sh

# Check if PostgreSQL container is running
if [ "$(docker ps -q -f name=scribe-ai-postgres-container)" ]; then
    echo "PostgreSQL container is already running."
else
    # Check if PostgreSQL container exists but is not running
    if [ "$(docker ps -aq -f status=exited -f name=scribe-ai-postgres-container)" ]; then
        # Start the existing PostgreSQL container
        docker start scribe-ai-postgres-container
    else
        # Build the Docker image for PostgreSQL
        docker build -t postgres .

        # Run the PostgreSQL Docker container
        docker run -d --name scribe-ai-postgres-container -p 5432:5432 postgres
    fi
fi

# Check if Azurite container is running
if [ "$(docker ps -q -f name=azurite-container)" ]; then
    echo "Azurite container is already running."
else
    # Check if Azurite container exists but is not running
    if [ "$(docker ps -aq -f status=exited -f name=azurite-container)" ]; then
        # Start the existing Azurite container
        docker start azurite-container
    else
        # Build the Docker image for Azurite
        docker build -t azurite - <<EOF
FROM mcr.microsoft.com/azure-storage/azurite
EOF

        # Run the Azurite Docker container
        docker run -d --name azurite-container -p 10000:10000 -p 10001:10001 -p 10002:10002 azurite
    fi
fi