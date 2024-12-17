# Base stage for shared setup
FROM node:20-slim as base
WORKDIR /app

# Install netcat for healthcheck and OpenSSL for Prisma
RUN apt-get update && \
    apt-get install -y \
    netcat-traditional \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Development stage
FROM base as development
RUN npm install
RUN npx prisma generate

# Mount the source code volume in docker-compose
EXPOSE 3001
CMD npm run start

# Production stage
FROM base as production
RUN npm install
RUN npx prisma generate

# Copy and build the application
COPY . .
RUN npm run build

EXPOSE 3001
CMD ["node", "dist/server.js"]
