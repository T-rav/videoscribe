# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variables
ENV RABBITMQ_URL=amqp://guest:guest@localhost:5672/
ENV TRANSCRIPTION_QUEUE_NAME=transcription-jobs
ENV TRANSCRIPTION_QUEUE_NAME_DEMO=transcription-jobs-demo

CMD ["python", "listener.py"]