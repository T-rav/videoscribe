import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { rateLimiterMiddleware } from './middleware/rateLimiter';
import transcribeRoutes from './routes/transcribeRoutes';
import authRoutes from './routes/authRoutes';
import logger from './utils/logger';
import { TranscriptionRequest } from './TranscriptionRequest';
import './middleware/passportConfig';
import passport from 'passport';
import session, { SessionOptions } from 'express-session';

// Load environment variables from .env file
dotenv.config();

const createApp = (transcribe: (req: TranscriptionRequest) => Promise<any>) => {
  const app = express();

  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your_secret_key',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === 'production' }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(rateLimiterMiddleware);

  app.use(authRoutes);
  app.use('/transcribe', transcribeRoutes(transcribe));

  // Global error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Global Error Handler:', err);
    res.status(500).json({ error: 'An internal server error occurred' });
  });

  return app;
};

export default createApp;
