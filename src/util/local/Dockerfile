# Use the official PostgreSQL image from the Docker Hub
FROM postgres:latest

# Set environment variables for PostgreSQL
ENV POSTGRES_USER=user
ENV POSTGRES_PASSWORD=password
ENV POSTGRES_DB=scribe.ai

# Expose the PostgreSQL port
EXPOSE 5432

# Add a custom initialization script if needed
# COPY init.sql /docker-entrypoint-initdb.d/

# The default command will run the PostgreSQL server
CMD ["postgres"]