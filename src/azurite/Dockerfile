FROM mcr.microsoft.com/azure-storage/azurite:3.23.0

USER root
RUN apk add --no-cache curl netcat-openbsd && \
    mkdir -p /opt/azurite && \
    chown -R node:node /opt/azurite

USER node
VOLUME /opt/azurite
