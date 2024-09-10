import logger from "../utils/logger";
import amqp from 'amqplib';

const connectionString = process.env.RABBITMQ_CONNECTION_STRING!;
const queueName = process.env.UPDATE_QUEUE_NAME!;

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

        await this.channel!.assertQueue(queueName, { durable: true });

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
                    this.channel!.nack(msg, false, false);
                }
            }
        }, { noAck: false });

        logger.info(`Listening for messages on queue: ${queueName}`);
    }
}

export { RabbitMQListener };