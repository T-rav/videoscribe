import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

export const verifyTokenFromCookie = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decodedToken: any) => {
    if (err) {
      logger.error('Token verification failed:', err);
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = decodedToken;
    next();
  });
};
