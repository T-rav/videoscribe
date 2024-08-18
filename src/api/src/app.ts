import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { rateLimiterMiddleware } from './middleware/rateLimiter';
import transcribeRoutes from './routes/transcribeRoutes';
import logger from './utils/logger';
import { TranscriptionRequest } from './TranscriptionRequest';

// Load environment variables from .env file
dotenv.config();

const createApp = (transcribe: (req: TranscriptionRequest) => Promise<any>) => {
  const app = express();

  app.use(rateLimiterMiddleware);
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/transcribe', transcribeRoutes(transcribe));

  // Global error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Global Error Handler:', err);
    res.status(500).json({ error: 'An internal server error occurred' });
  });

  return app;
};

export default createApp;
