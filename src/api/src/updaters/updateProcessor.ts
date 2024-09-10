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
            if (message.status === JobStatus.failed) {
                await prisma.job.update({
                    where: { qid: message.jobId },
                    data: { status: message.status, error: message.error },
                });
            }
            if (message.status === JobStatus.in_progress) {

                const job = await prisma.job.update({
                    where: { qid: message.jobId },
                    data: { status: message.status },
                });
                
                const media = await prisma.media.create({
                    data: {
                        userId: job.userId,
                        title: message.title,
                        duration: message.duration,
                        blobUrl: message.blobUrl,
                    },
                });
                
                await prisma.job.update({
                    where: { qid: message.jobId },
                    data: { mediaId: media.id},
                });
            }
            if (message.status === JobStatus.finished) {
                const job = await prisma.job.update({
                    where: { qid: message.jobId },
                    data: { status: message.status },
                });

                const transcription = await prisma.transcription.create({
                    data: {
                        jobId: message.jobId,
                        mediaId: job.mediaId,
                        transcript: message.transcript,
                        transformed: message.transformed,
                        transcriptionType: job.transcriptionType,
                        blobUrl: message.blobUrl,
                    },
                });

                const transformation = await prisma.transformation.create({
                    data: {
                        transcriptionId: transcription.id,
                        mediaId: job.mediaId,
                        type: job.transform,
                        blobUrl: message.blobUrl,
                    },
                });
            }

        }, {
            timeout: 30000, // 30 seconds
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        });
        logger.info("Database updated successfully");
    } catch (error) {
        logger.error("Failed to update database:", error);
    }

});