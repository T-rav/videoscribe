#!/bin/sh

# Get the absolute path to the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Start all services
docker compose up -d

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
