import logger from "../utils/logger";
import { JobMessage } from "./interfaces/jobs";
import { TranscriptionMessage } from "./interfaces/transcription";
import amqp from 'amqplib';

const connectionString = process.env.RABBITMQ_CONNECTION_STRING!;
const queueName = process.env.TRANSCRIPTION_QUEUE_NAME!;

export async function createJob(toSend: TranscriptionMessage) {
    const connection = await amqp.connect(connectionString);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });

    const message = {
        body: {
            jobId: toSend.jobId,
            transcriptionType: toSend.transcriptionType,
            transform: toSend.transform,
            isFile: toSend.isFile,
            content: toSend.content,
            userId: toSend.userId
        } as JobMessage,
        contentType: 'application/json'
    };

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        contentType: 'application/json'
    });

    logger.debug('Job sent to RabbitMQ:', message.body.jobId);

    await channel.close();
    await connection.close();
}
