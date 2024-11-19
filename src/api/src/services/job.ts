import logger from "../utils/logger";
import { JobMessage } from "./interfaces/jobs";
import { TranscriptionMessage } from "./interfaces/transcription";
import amqp from 'amqplib';

const connectionString = process.env.RABBITMQ_CONNECTION_STRING!;
const queueName = process.env.TRANSCRIPTION_QUEUE_NAME!;
const queueNameDemo = process.env.TRANSCRIPTION_QUEUE_NAME_DEMO!;
const deadLetterExchange = process.env.DEAD_LETTER_EXCHANGE!;

export async function createJob(toSend: TranscriptionMessage) {
    const connection = await amqp.connect(connectionString);
    const channel = await connection.createChannel();
    const isDemo = toSend.userId === '0';
    const selectedQueueName = isDemo ? queueNameDemo : queueName;

    // Declare the dead-letter exchange
    await channel.assertExchange(deadLetterExchange, 'direct', { durable: true });

    // Declare the dead-letter queue
    const deadLetterQueue = `${selectedQueueName}-dlq`;
    await channel.assertQueue(deadLetterQueue, { durable: true });
    await channel.bindQueue(deadLetterQueue, deadLetterExchange, `${selectedQueueName}-dlq`);

    // Declare the main queue with dead-letter exchange and routing key
    await channel.assertQueue(selectedQueueName, {
        durable: true,
        arguments: {
            'x-message-ttl': 604800000, // 1 week in milliseconds
            'x-dead-letter-exchange': deadLetterExchange,
            'x-dead-letter-routing-key': `${selectedQueueName}-dlq`
        }
    });

    const message = {
        jobId: toSend.jobId,
        transcriptionType: toSend.transcriptionType,
        transform: toSend.transform,
        isFile: toSend.isFile,
        content: toSend.content,
        userId: toSend.userId
    } as JobMessage;

    channel.sendToQueue(selectedQueueName, Buffer.from(JSON.stringify(message)), {
        contentType: 'application/json',
        persistent: true
    });

    logger.debug(`Job sent to RabbitMQ: ${message.jobId}`);

    await channel.close();
    await connection.close();
}
