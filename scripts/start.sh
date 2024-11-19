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
cd "$PROJECT_ROOT/src/api" || {
  echo "Error: Failed to change directory to $PROJECT_ROOT/src/api"
  exit 1
}

# Verify Node.js installation
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed"
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
if ! npm install; then
  echo "Error: Failed to install dependencies"
  exit 1
fi

# Run migrations
echo "Running database migrations..."
if ! npx prisma migrate deploy; then
  echo "Error: Failed to run database migrations"
  exit 1
fi

echo "Setup completed successfully!"
