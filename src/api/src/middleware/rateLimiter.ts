import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

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
    return req.cookies?.user_id || req.ip; // Ensure this always returns a string
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a rate limiter instance for non-authenticated users
const nonAuthRateLimiter = rateLimit({
  windowMs: parseTimeWindow(process.env.UNAUTHORIZED_RATE_WINDOW || '24h'), // 24 hour window
  max: parseInt(process.env.UNAUTHORIZED_RATE_LIMIT || '5'), // Limit each IP to 5 requests per windowMs
  keyGenerator: (req: Request) => req.ip || '_SOME_IP_', // Ensure this always returns a string
  standardHeaders: true,
  legacyHeaders: false,
});

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const isAuthenticated = req.cookies?.isAuthenticated === 'true';

  // Apply the appropriate rate limiter based on authentication status
  if (isAuthenticated) {
    authRateLimiter(req, res, next);
  } else {
    nonAuthRateLimiter(req, res, next);
  }
};
