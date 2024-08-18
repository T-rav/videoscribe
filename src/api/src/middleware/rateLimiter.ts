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

const createRateLimiter = (windowMs: number, max: number, keyGenerator: (req: Request) => string) =>
  rateLimit({
    windowMs,
    max,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
  });

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const isAuthenticated = req.cookies.isAuthenticated === 'true';
  const windowMs = parseTimeWindow(
    process.env[isAuthenticated ? 'AUTHORIZED_RATE_WINDOW' : 'UNAUTHORIZED_RATE_WINDOW'] || (isAuthenticated ? '1h' : '24h')
  );
  const maxRequests = parseInt(
    process.env[isAuthenticated ? 'AUTHORIZED_RATE_LIMIT' : 'UNAUTHORIZED_RATE_LIMIT'] || (isAuthenticated ? '10' : '5')
  );
  const keyGenerator = (req: Request) => req.cookies.user_id;

  const limiter = createRateLimiter(windowMs, maxRequests, keyGenerator);
  limiter(req, res, next);
};
