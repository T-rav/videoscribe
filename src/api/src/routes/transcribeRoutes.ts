import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import { TranscriptionServiceType } from '../enums/TranscriptionServiceType';
import logger from '../utils/logger';
import { saveJobToStorage } from '../services/blobStorage';
import { TranscriptionMessage, TranscriptionRequest } from '../services/interfaces/transcription';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const isValidUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtube\.com|youtu\.?be)\/(watch\?v=|embed\/|v\/|.+\?v=|live\/|shorts\/)?([a-zA-Z0-9_-]{11})$/;
  const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/(file\/d\/|present\/d\/|uc\?(export=download&)?id=)([a-zA-Z0-9_-]+)(\/view)?$/;
  const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/(\d+)(\/[a-zA-Z0-9_-]+)?(\?.*)?$/;
  
  return youtubeRegex.test(url) || googleDriveRegex.test(url) || vimeoRegex.test(url);
};

export default function transcribeRoutes(transcribe: (req: TranscriptionRequest) => Promise<any>) {
  router.post('/link', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url, transform, transcriptionType } = req.body;

      if (!isValidUrl(url)) {
        return res.status(400).json({ error: 'Invalid URL. It needs to be a valid YouTube, Vimeo, or Google Drive URL' });
      }

      const transcriptionMessage: TranscriptionMessage = {
        jobId: uuidv4(),
        transcriptionType,
        transform,
        isFile: false,
        content: url,
        userId: undefined // todo: properly extract user id
      };

      // todo : log the job in the database too!
      const result = await saveJobToStorage(transcriptionMessage);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/file', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    const { transcriptionType, transform } = req.body;
    let filePath = '';

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
        userId: undefined // todo: properly extract user id
      };

      const result = await saveJobToStorage(transcriptionMessage);
      res.json(result);
    } catch (error) {
      if (file) {
        fs.unlink(filePath, (err) => {
          if (err) {
            logger.error('Failed to delete file:', err);
          } else {
            logger.info(`Temp file ${filePath} deleted successfully`);
          }
        });
      }
      next(error);
    }
  });

  return router;
}
