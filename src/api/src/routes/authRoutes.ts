import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../utils/logger';
import { AccountType, PrismaClient } from '@prisma/client';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

interface User {
  id: string;
  email: string;
  name: {givenName: string, familyName: string};
  photos: Array<{ value: string }>;
}

// Google OAuth authentication route
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'consent' }));

// Google OAuth callback route
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?msg=failed' }),
  async (req: Request, res: Response) => {
    const user = req.user as any; // The authenticated user object

    const dbUser = await prisma.user.findFirst({
      where: { qid: user.qid, accountType: AccountType.google },
    });

    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign(
      {
        name: `${dbUser?.firstName} ${dbUser?.lastName}`,
        id: dbUser?.qid,
        email: dbUser?.email,
        picture: dbUser?.picture,
      },
      process.env.JWT_SECRET as string || 'your_jwt_secret',
      {
        expiresIn: '24h',
      }
    );
    // Set the token and user information in cookies
    // { httpOnly: true, sameSite: 'none', secure: process.env.NODE_ENV === 'production' }
    res.cookie('token', token, { httpOnly: true, sameSite: 'none' } );
    res.redirect('http://localhost:3000/dashboard');
  }
);

// Logout route
router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// API route to verify the user's authentication status
router.get('/auth/verify', async (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    logger.error('Token is missing');
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, async (err: any, decodedToken: any) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        // Handle token expiration
        const decoded = jwt.decode(token) as jwt.JwtPayload; // Decode the expired token to get user info
        if (!decoded) {
          return res.status(403).json({ message: 'Invalid token' });
        }

        // Verify the user exists in the database before issuing a new token
        const existingUser = await prisma.user.findUnique({ where: { email: decoded.email } });
        if (!existingUser) {
          return res.status(403).json({ message: 'User not found' });
        }

        const newToken = jwt.sign(
          {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            picture: decoded.picture,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: '24h' } // Set your desired expiration time
        );

        // Set the new token in the cookies
        res.cookie('token', newToken, { httpOnly: true, sameSite: 'none' });
        return res.status(200).json({ message: 'Token refreshed', user: decoded });
      } else {
        logger.error('Token verification failed:', err);
        return res.status(403).json({ message: 'Invalid token' });
      }
    }

    const user = {
      name: `${decodedToken.name}`,
      id: decodedToken.id,
      email: decodedToken.email,
      picture: decodedToken.picture,
    };
    res.status(200).json({ user: user });
  });
});

export default router;
