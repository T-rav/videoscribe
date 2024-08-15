// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { TranscriptionServiceType } from './enums/TranscriptionServiceType';
import logger from './utils/logger';

interface TranscriptionRequest {
  url?: string;
  transcriptionType: TranscriptionServiceType;
  filePath?: string;
}

interface TranscriptionResponse {
  url?: string;
  filePath?: string;
  transcriptionType: TranscriptionServiceType;
  transcription: string;
}

type TranscribeFunction = (req: TranscriptionRequest) => Promise<TranscriptionResponse>;

const createApp = (transcribe: TranscribeFunction) => {
  const app = express();
  const upload = multer({ dest: 'uploads/' }); // upload directory

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data

  const isValidUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtube\.com|youtu\.?be)\/(watch\?v=|embed\/|v\/|.+\?v=|live\/|shorts\/)?([a-zA-Z0-9_-]{11})$/;
    const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/(file\/d\/|present\/d\/|uc\?(export=download&)?id=)([a-zA-Z0-9_-]+)(\/view)?$/;
    return youtubeRegex.test(url) || googleDriveRegex.test(url);
  };

  app.post('/transcribe_link', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url, transcriptionType } = req.body;

      if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
        return res.status(400).json({ error: 'Invalid transcription type' });
      }

      if (!url || !isValidUrl(url)) {
        return res.status(400).json({ error: 'Invalid URL. It needs to be a valid YouTube or Google Drive URL' });
      }

      const result = await transcribe({ url, transcriptionType });
      res.json(result);
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  });

  app.post('/transcribe_file', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    const { transcriptionType } = req.body;

    try {
      if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
        return res.status(400).json({ error: 'Invalid transcription type' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Define the directory where you want to store uploaded files
      const uploadsDir = path.resolve('uploads');
      const filePath = path.join(uploadsDir, file.originalname);

      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }

      // Move the file from the temporary location to the final destination
      fs.renameSync(file.path, filePath);

      // Pass the file path and transform option to the transcribe function
      const result = await transcribe({ transcriptionType, filePath });
      res.json(result);
    } catch (error) {
      if (file) {
        // Cleanup: Delete the temp file if an error occurs
        fs.unlink(file.path, (err) => {
          if (err) {
            logger.error('Failed to delete temp file:', err);
          } else {
            logger.info(`Temp file ${file.path} deleted successfully`);
          }
        });
      }
      next(error); // Pass the error to the global error handler
    }
  });

  // Global error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Global Error Handler:', err); // Log the error to error.log using winston
    res.status(500).json({ error: 'An internal server error occurred' });
  });

  // Global error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Global Error Handler:', err); // Log the error to error.log using winston

    res.status(500).json({ error: 'An internal server error occurred' });
  });

  return app;
};

export default createApp;
