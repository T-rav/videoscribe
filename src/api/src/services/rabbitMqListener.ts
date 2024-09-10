import logger from "../utils/logger";
import amqp from 'amqplib';

const connectionString = process.env.RABBITMQ_CONNECTION_STRING!;
const queueName = process.env.UPDATE_QUEUE_NAME!;
const deadLetterExchange = process.env.DEAD_LETTER_EXCHANGE!;
const maxRetries = 5;

class RabbitMQListener {
    private connection: amqp.Connection | null = null;
    private channel: amqp.Channel | null = null;
    private handler: ((msg: any) => void) | null = null;

    private async establishConnection() {
        while (true) {
            try {
                this.connection = await amqp.connect(connectionString);
                this.channel = await this.connection.createChannel();
                logger.info("Successfully connected to RabbitMQ");
                break;
            } catch (e) {
                logger.error(`Connection to RabbitMQ failed: ${e}. Retrying in 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    public async listen(handler: (msg: any) => void) {
        this.handler = handler;
        await this.establishConnection();

        await this.channel!.assertQueue(queueName, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': deadLetterExchange,
                'x-dead-letter-routing-key': `${queueName}-dlq`,
                'x-message-ttl': 1000 * 60 * 60 * 24 * 7  // 1 week in milliseconds
            }
        });

        this.channel!.consume(queueName, (msg) => {
            if (msg !== null) {
                const messageContent = msg.content.toString();
                logger.info(`Received message: ${messageContent}`);
                try {
                    const parsedMessage = JSON.parse(messageContent);
                    this.handler!(parsedMessage);
                    this.channel!.ack(msg);
                } catch (e) {
                    logger.error(`Failed to process message: ${e}`);
                    this.handleRetry(msg);
                }
            }
        }, { noAck: false });

        logger.info(`Listening for messages on queue: ${queueName}`);
    }

    private handleRetry(msg: amqp.Message) {
        const headers = msg.properties.headers || {};
        const retryCount = headers['x-retry-count'] || 0;

        if (retryCount < maxRetries) {
            this.channel!.nack(msg, false, true);
            this.channel!.sendToQueue(queueName, msg.content, {
                headers: { 'x-retry-count': retryCount + 1 },
                persistent: true
            });
            logger.info(`Retrying message, attempt ${retryCount + 1}`);
        } else {
            this.channel!.nack(msg, false, false);
            logger.error(`Message failed after ${maxRetries} attempts, sending to dead-letter queue`);
        }
    }
}

export { RabbitMQListener };