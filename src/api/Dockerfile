FROM node:20-slim

WORKDIR /app

# Install netcat for healthcheck
RUN apt-get update && apt-get install -y netcat-traditional && rm -rf /var/lib/apt/lists/*

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Run database migrations and start the application in development mode
CMD npx prisma migrate deploy && npm run start
