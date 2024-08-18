import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { TranscriptionServiceType } from '../enums/TranscriptionServiceType';
import { TranscriptionRequest } from '../TranscriptionRequest';
import logger from '../utils/logger';

const router = Router();
const upload = multer({ dest: 'uploads/' });

const isValidUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtube\.com|youtu\.?be)\/(watch\?v=|embed\/|v\/|.+\?v=|live\/|shorts\/)?([a-zA-Z0-9_-]{11})$/;
  const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/(file\/d\/|present\/d\/|uc\?(export=download&)?id=)([a-zA-Z0-9_-]+)(\/view)?$/;
  const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/(\d+)(\/[a-zA-Z0-9_-]+)?$/;
  
  return youtubeRegex.test(url) || googleDriveRegex.test(url) || vimeoRegex.test(url);
};

export default function transcribeRoutes(transcribe: (req: TranscriptionRequest) => Promise<any>) {
  router.post('/transcribe_link', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url, transcriptionType } = req.body;

      if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
        return res.status(400).json({ error: 'Invalid transcription type' });
      }

      if (!url || !isValidUrl(url)) {
        return res.status(400).json({ error: 'Invalid URL. It needs to be a valid YouTube, Vimeo, or Google Drive URL' });
      }

      const result = await transcribe({ url, transcriptionType });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/transcribe_file', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    const { transcriptionType } = req.body;
    let filePath = '';

    try {
      if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
        return res.status(400).json({ error: 'Invalid transcription type' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const uploadsDir = path.resolve('uploads');
      filePath = path.join(uploadsDir, file.originalname);
      fs.renameSync(file.path, filePath);

      const result = await transcribe({ url: filePath, transcriptionType });
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
