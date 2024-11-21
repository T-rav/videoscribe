# EchoScript.ai Project TODO

## Docker Service Integration
- [ ] Add API service to docker-compose.yml
  - Configure environment variables
  - Set up appropriate ports
  - Link with PostgreSQL and RabbitMQ

- [ ] Add Updater service to docker-compose.yml
  - Configure environment variables
  - Link with RabbitMQ and Azurite

- [ ] Add Translator service to docker-compose.yml
  - Configure environment variables
  - Link with RabbitMQ

- [ ] Add UI service to docker-compose.yml
  - Configure environment variables
  - Set up ports for web access
  - Link with API service

- [ ] Test complete service startup/shutdown
  - Verify service dependencies
  - Check service communication
