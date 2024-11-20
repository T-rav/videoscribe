#!/bin/sh

# Get the absolute path to the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Parse command line arguments
ENVIRONMENT="dev"
while [ "$#" -gt 0 ]; do
  case "$1" in
    --prod) ENVIRONMENT="prod"; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
done

if [ "$ENVIRONMENT" = "prod" ]; then
  echo "Stopping production services..."
  docker compose down

  echo "Cleaning up any orphaned containers..."
  docker container prune -f
else
  echo "Stopping development services..."
  docker compose down
fi

echo "All services have been stopped."
