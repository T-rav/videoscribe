import logger from "../utils/logger";
import { TranscriptionMessage } from "./interfaces/transcription";
import amqp from 'amqplib';

const connectionString = process.env.RABBITMQ_CONNECTION_STRING!;
const queueName = process.env.TRANSCRIPTION_QUEUE_NAME!;

export async function createJob(toSend: TranscriptionMessage) {
    const connection = await amqp.connect(connectionString);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });

    const message = {
        body: toSend,
        contentType: 'application/json'
    };

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        contentType: 'application/json'
    });

    logger.debug('Job sent to RabbitMQ:', message.body);

    await channel.close();
    await connection.close();
}
