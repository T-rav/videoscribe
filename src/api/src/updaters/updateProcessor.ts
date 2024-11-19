import { RabbitMQListener } from '../services/rabbitMqListener';
import dotenv from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import { TranscriptionUpdate } from './TranscriptionUpdate';
import logger from '../utils/logger';
import { JobStatus } from '../enums/JobStatus';

dotenv.config();

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const prisma = new PrismaClient();
const listener = new RabbitMQListener();

async function executeWithRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retryCount >= MAX_RETRIES) {
            logger.error(`Failed after ${MAX_RETRIES} retries:`, error);
            throw error;
        }

        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        logger.warn(`Retry attempt ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return executeWithRetry(operation, retryCount + 1);
    }
}

listener.listen(async (message: TranscriptionUpdate) => {
    logger.info(`Processing status: ${message.status}`);
    
    try {
        await executeWithRetry(async () => {
            await prisma.$transaction(async (prisma) => {
                if (message.status === JobStatus.failed) {
                    await prisma.job.update({
                        where: { qid: message.jobId },
                        data: { status: message.status, error: message.error ?? '' },
                    });
                }else if (message.status === JobStatus.inProgress) {

                    const job = await prisma.job.update({
                        where: { qid: message.jobId },
                        data: { status: message.status },
                    });
                    
                    const media = await prisma.media.create({
                        data: {
                            userId: job.userId,
                            title: message.title ??  '',
                            duration: message.duration,
                            blobUrl: message.blobUrl ?? '',
                            description: message.description ?? '',
                        },
                    });
                    
                    await prisma.job.update({
                        where: { qid: message.jobId },
                        data: { mediaId: media.id},
                    });
                }else if (message.status === JobStatus.finished) {
                    const job = await prisma.job.update({
                        where: { qid: message.jobId },
                        data: { status: message.status },
                    });

                    const transcription = await prisma.transcription.create({
                        data: {
                            mediaId: job.mediaId ?? 0,
                            transcriptionType: job.transcriptionType,
                            blobUrl: message.transcript ?? '', // message.blobUrl ?? 
                        },
                    });

                    const transformation = await prisma.transformation.create({
                        data: {
                            transcriptionId: transcription.id,
                            mediaId: job.mediaId ?? 0,
                            type: job.transform,
                            blobUrl: message.transformed ?? '',
                        },
                    });
                }else{
                    logger.error(`Unknown status: ${message.status}`);
                }
            }, {
                timeout: 30000, // 30 seconds
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable
            });
        });
        logger.info("Database updated successfully");
    } catch (error) {
        logger.error("Failed to update database:", error);
    }

});