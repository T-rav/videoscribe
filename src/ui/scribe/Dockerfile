# Base stage for shared dependencies
FROM node:20-slim as base
WORKDIR /app
COPY package*.json ./

# Development stage
FROM base as development
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]

# Production stage
FROM base as production
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
