import { RabbitMQListener } from '../services/rabbitMqListener';
import dotenv from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import { TranscriptionUpdate } from './TranscriptionUpdate';
import logger from 'src/utils/logger';
import { JobStatus } from '../enums/JobStatus';

dotenv.config();

const prisma = new PrismaClient();
const listener = new RabbitMQListener();

listener.listen(async (message : TranscriptionUpdate) => {
    logger.info("Processing message:", message);
    
    try {
        await prisma.$transaction(async (prisma) => {
            if (message.status === JobStatus.finished) {
                await prisma.job.update({
                    where: { qid: message.jobId },
                    data: { status: message.status },
                });
                // await prisma.transcription.create({
                //     data: {
                //         jobId: message.jobId,
                //         transcript: message.transcript,
                //         transformed: message.transformed,
                //     });
                        
            }
            if (message.status === JobStatus.failed) {
                await prisma.job.update({
                    where: { qid: message.jobId },
                    data: { status: message.status, error: message.error },
                });
            }
        }, {
            timeout: 5000, // Timeout in milliseconds
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Set the desired isolation level
        });
        logger.info("Database updated successfully");
    } catch (error) {
        logger.error("Failed to update database:", error);
    }

});