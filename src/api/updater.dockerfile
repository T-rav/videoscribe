# Use an official Node runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages
RUN npm install

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variables
ENV RABBITMQ_CONNECTION_STRING=amqp://guest:guest@localhost:5672/
ENV TRANSCRIPTION_QUEUE_NAME=transcription-jobs
ENV TRANSCRIPTION_QUEUE_NAME_DEMO=transcription-jobs-demo
ENV UPDATE_QUEUE_NAME=transcription-updates

# Run the app
CMD ["node", "src/api/src/updater.ts"]