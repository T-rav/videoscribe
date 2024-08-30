import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { TranscriptionServiceType } from '../enums/TranscriptionServiceType';
import logger from '../utils/logger';
import { saveJobToStorage } from '../services/blobStorage';
import { TranscriptionMessage, TranscriptionRequest, TranscriptionResponse } from '../services/interfaces/transcription';
import { v4 as uuidv4 } from 'uuid';
import { verifyTokenFromCookie } from '../middleware/verifyTokenFromCookie';
import { JobStatus } from '../enums/JobStatus';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const logJobInDatabase = async (transcriptionMessage: TranscriptionMessage, userId: string | null, contentReference: string) => {
    const user = await prisma.user.findFirst({
        where: {
            qid: userId || '0'
        }
    });
    await prisma.job.create({
      data: {
        qid: transcriptionMessage.jobId,
      title: transcriptionMessage.isFile ? 'File Transcription Job' : 'Link Transcription Job',
      description: transcriptionMessage.isFile ? 'Transcription job for a file' : 'Transcription job for a link',
      userId: user?.id,
      status: JobStatus.pending,
      transcriptionType: transcriptionMessage.transcriptionType,
      transform: transcriptionMessage.transform,
      contentReference,
    },
  });
};

const isValidUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtube\.com|youtu\.?be)\/(watch\?v=|embed\/|v\/|.+\?v=|live\/|shorts\/)?([a-zA-Z0-9_-]{11})$/;
  const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/(file\/d\/|present\/d\/|uc\?(export=download&)?id=)([a-zA-Z0-9_-]+)(\/view)?$/;
  const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/(\d+)(\/[a-zA-Z0-9_-]+)?(\?.*)?$/;
  
  return youtubeRegex.test(url) || googleDriveRegex.test(url) || vimeoRegex.test(url);
};

export const getJobStatusFromStorage = async (jobId: string) => {
  // Dummy implementation: Replace with actual DB lookup logic
  const dummyJobStatus = {
    jobId,
    status: 'finished',
    title: 'Dummy Title',
    duration: '120',
    transcript: 'Dummy transcript content',
    transformed_transcript: 'Dummy transformed transcript content',
  };

  return dummyJobStatus;
};

const handleLinkTranscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, transform, transcriptionType } = req.body;
    const user = req.user as any;

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL. It needs to be a valid YouTube, Vimeo, or Google Drive URL' });
    }

    const transcriptionMessage: TranscriptionMessage = {
      jobId: uuidv4(),
      transcriptionType,
      transform,
      isFile: false,
      content: url,
      userId: user?.qid || '0' 
    };

    await logJobInDatabase(transcriptionMessage, user?.id || null, url);
    await saveJobToStorage(transcriptionMessage);
    logger.info(`Job ID: ${transcriptionMessage.jobId} published to blob storage`);
    const result: TranscriptionResponse = {
      jobId: transcriptionMessage.jobId
    };
    
    res.json(result);
  } catch (error) {
    logger.error(`Error in transcribeRoutes.ts: ${error}`);
    next(error);
  }
};

const handleFileTranscription = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  const { transcriptionType, transform } = req.body;
  const user = req.user as any;

  try {
    if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
      return res.status(400).json({ error: 'Invalid transcription type' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const transcriptionMessage: TranscriptionMessage = {
      jobId: uuidv4(),
      transcriptionType,
      transform,
      isFile: true,
      content: file.buffer.toString('base64'),
      mimeType: file.mimetype,
      fileName: file.originalname,
      userId: user?.qid || '0' 
    };

    await logJobInDatabase(transcriptionMessage, user?.id || null, file.originalname);

    await saveJobToStorage(transcriptionMessage);
    const result: TranscriptionResponse = {
      jobId: transcriptionMessage.jobId
    };
    res.json(result);
  } catch (error) {
    logger.error(`Error in transcribeRoutes.ts: ${error}`);
    next(error);
  }
};

export default function transcribeRoutes(transcribe: (req: TranscriptionRequest) => Promise<any>) {
  router.post('/link', verifyTokenFromCookie, handleLinkTranscription);

  router.post('/link/demo', handleLinkTranscription);

  router.post('/file', upload.single('file'), handleFileTranscription);

  router.post('/file/demo', upload.single('file'), handleFileTranscription);

  router.get('/status/:jobId', async (req: Request, res: Response, next: NextFunction) => {
    const { jobId } = req.params;

    try {
      // Dummy implementation to simulate DB lookup
      const jobStatus = await getJobStatusFromStorage(jobId);

      if (!jobStatus) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(jobStatus);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
