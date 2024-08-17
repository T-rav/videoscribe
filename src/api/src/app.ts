// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { TranscriptionServiceType } from './enums/TranscriptionServiceType';
import logger from './utils/logger';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { TranscriptionRequest } from './TranscriptionRequest';
import { TranscriptionResponse } from './TranscriptionResponse';

// Load environment variables from .env file
dotenv.config();

type TranscribeFunction = (req: TranscriptionRequest) => Promise<TranscriptionResponse>;

const createApp = (transcribe: TranscribeFunction) => {
  const app = express();
  const upload = multer({ dest: 'uploads/' }); // upload directory

  // Convert time window from .env format to milliseconds
  const parseTimeWindow = (time: string): number => {
    const match = time.match(/(\d+)([hms])/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return 0;
    }
  };

  // Rate limiter for unauthorized users: limit from .env
  const unauthorizedRateLimiter = rateLimit({
    windowMs: parseTimeWindow(process.env.UNAUTHORIZED_RATE_WINDOW || '24h'), // Default to 24 hours
    max: parseInt(process.env.UNAUTHORIZED_RATE_LIMIT || '5'), // Default to 5 requests
    keyGenerator: (req) => req.cookies.user_id, // Use user_id cookie as the key
    message: 'You have exceeded the 5 requests in 24 hours limit. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiter for authorized users: limit from .env
  const authorizedRateLimiter = rateLimit({
    windowMs: parseTimeWindow(process.env.AUTHORIZED_RATE_WINDOW || '1h'), // Default to 1 hour
    max: parseInt(process.env.AUTHORIZED_RATE_LIMIT || '10'), // Default to 10 requests
    keyGenerator: (req) => req.cookies.user_id, // Use user_id cookie as the key
    message: 'You have exceeded the 10 requests per hour limit. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Middleware to check if the user is authenticated
  function isAuthenticated(req: Request): boolean {
    return req.cookies.isAuthenticated === 'true';
  }

  app.use((req, res, next) => {
    if (isAuthenticated(req)) {
      authorizedRateLimiter(req, res, next);
    } else {
      unauthorizedRateLimiter(req, res, next);
    }
  });
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data

  const isValidUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtube\.com|youtu\.?be)\/(watch\?v=|embed\/|v\/|.+\?v=|live\/|shorts\/)?([a-zA-Z0-9_-]{11})$/;
    const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/(file\/d\/|present\/d\/|uc\?(export=download&)?id=)([a-zA-Z0-9_-]+)(\/view)?$/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/(\d+)(\/[a-zA-Z0-9_-]+)?$/;
    
    return youtubeRegex.test(url) || googleDriveRegex.test(url) || vimeoRegex.test(url);
};


  app.post('/transcribe_link', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url, transcriptionType } = req.body;

      if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
        return res.status(400).json({ error: 'Invalid transcription type' });
      }

      if (!url || !isValidUrl(url)) {
        return res.status(400).json({ error: 'Invalid URL. It needs to be a valid YouTube, Vimeo or Google Drive URL' });
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
    let filePath = '';

    try {
      if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
        return res.status(400).json({ error: 'Invalid transcription type' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Define the directory where you want to store uploaded files
      const uploadsDir = path.resolve('uploads');
      filePath = path.join(uploadsDir, file.originalname);
      fs.renameSync(file.path, filePath);

      // Pass the file path and transform option to the transcribe function
      const result = await transcribe({ url:filePath, transcriptionType });
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
      next(error); // Pass the error to the global error handler
    }
  });

  // Global error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Global Error Handler:', err); // Log the error to error.log using winston

    res.status(500).json({ error: 'An internal server error occurred' });
  });

  return app;
};

export default createApp;
