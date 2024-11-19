#!/bin/sh

# Get the absolute path to the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Start all services
if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker daemon is not running"
  exit 1
fi

if ! docker compose up -d; then
  echo "Error: Failed to start Docker services"
  exit 1
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec scribe-ai-postgres-container pg_isready -U user -d scribe.ai; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is ready! Running migrations..."

# Run Prisma migrations
cd "$PROJECT_ROOT/src/api"
npm install
npx prisma migrate deploy
