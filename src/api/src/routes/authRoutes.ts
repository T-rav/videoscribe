import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../utils/logger';
import { PrismaClient } from '@prisma/client'; // Import Prisma Client

dotenv.config();

const router = Router();
const prisma = new PrismaClient(); // Initialize Prisma Client

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
    // Create a token for the authenticated user
    const user = req.user as User | undefined; // The authenticated user object

    if (!user) {
      logger.error('User object is undefined after successful authentication');
      res.redirect('/login?msg=failed');
      return;
    }

    // Save user to the database
    try {
      const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (!existingUser) {
        await prisma.user.create({
          data: {
            qid: user.id,
            firstName: user.name.givenName,
            lastName: user.name.familyName,
            email: user.email,
            picture: user.photos[0].value,
            accountType: 'google',
          },
        });
        logger.info('New user saved to the database');
      } else {
        logger.info('User already exists in the database');
      }
    } catch (error) {
      logger.error('Error saving user to the database:', error);
      res.redirect('/login?msg=failed');
      return;
    }

    const token = jwt.sign(
      {
        name: `${user.name.givenName} ${user.name.familyName}`,
        id: user.id,
        email: user.email,
        picture: user.photos[0].value,
      },
      process.env.JWT_SECRET as string || 'your_jwt_secret',
      {
        expiresIn: '24h',
      }
    );
    // Set the token and user information in cookies
    res.cookie('token', token, { httpOnly: true, sameSite: 'none', secure: process.env.NODE_ENV === 'production' });

    logger.info("Auth: Set token in cookies");

    // Redirect to dashboard or home
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
        res.cookie('token', newToken, { httpOnly: true });

        logger.info('Token refreshed for user:', decoded.name);
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
    logger.info('User verified:', user);
    res.status(200).json({ user: user });
  });
});

export default router;
