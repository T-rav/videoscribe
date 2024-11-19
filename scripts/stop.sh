#!/bin/sh

# Get the absolute path to the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Stopping all services..."
docker compose down

echo "Cleaning up any orphaned containers..."
docker container prune -f

echo "All services have been stopped."
