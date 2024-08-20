import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

export const parseTimeWindow = (time: string): number => {
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

// Create a rate limiter instance for authenticated users
const authRateLimiter = rateLimit({
  windowMs: parseTimeWindow(process.env.AUTHORIZED_RATE_WINDOW || '1h'), // 1 hour window
  max: parseInt(process.env.AUTHORIZED_RATE_LIMIT || '10'), // Limit each IP to 10 requests per windowMs
  keyGenerator: (req: Request) => {
    const token = req.cookies.token;
    if (token) {
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string);
        return (decodedToken as any).email; // Use the user ID from the token if valid
      } catch (err) {
        logger.error('Invalid JWT token:', err);
        return req.hostname || 'ip';
      }
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a rate limiter instance for non-authenticated users
const nonAuthRateLimiter = rateLimit({
  windowMs: parseTimeWindow(process.env.UNAUTHORIZED_RATE_WINDOW || '24h'), // 24 hour window
  max: parseInt(process.env.UNAUTHORIZED_RATE_LIMIT || '5'), // Limit each IP to 5 requests per windowMs
  keyGenerator: (req: Request) => req.hostname || 'ip', // Use IP as the identifier for non-authenticated users
  standardHeaders: true,
  legacyHeaders: false,
});

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  let isAuthenticated = false;

  const isLocalhost = req.hostname === 'localhost' || req.ip === '127.0.0.1' || req.ip === '::1';
  if (isLocalhost) {
    logger.info('Bypassing rate limiter for localhost');
    return next();
  }

  if (token) {
    logger.info('Token found');
    try {
      jwt.verify(token, process.env.JWT_SECRET as string);
      isAuthenticated = true;
    } catch (err) {
      logger.error('Invalid JWT token:', err);
    }
  }else{
    logger.info('No token found');
  }

  logger.info(`Rate Limiter Middleware - isAuthenticated: ${isAuthenticated}`);

  // Apply the appropriate rate limiter based on authentication status
  if (isAuthenticated) {
    authRateLimiter(req, res, next);
  } else {
    nonAuthRateLimiter(req, res, next);
  }
};
