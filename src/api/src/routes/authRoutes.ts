import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const router = Router();

interface User {
  id: string;
  email: string;
  name: {givenName: string, familyName: string};
  photos: Array<{ value: string }>;
}

// Google OAuth authentication route
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'none'}));

// Google OAuth callback route
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?msg=failed' }),
  (req: Request, res: Response) => {
    // Create a token for the authenticated user
    const user = req.user as User | undefined; // The authenticated user object

    if (!user) {
      logger.error('User object is undefined after successful authentication');
      res.redirect('/login?msg=failed');
      return;
    }

    const token = jwt.sign({ name: `${user.name.givenName} ${user.name.familyName}`, 
                             id: user.id, 
                             email: user.email, 
                             picture: user.photos[0].value 
                           }, 
                            process.env.JWT_SECRET as string || 'your_jwt_secret', 
                           {
                            expiresIn: '24h',
                           });

    logger.info('Generated JWT:', token);

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
router.get('/auth/verify', (req: Request, res: Response) => {
  const token = req.cookies.token;

  logger.info('Received token:', token);

  if (!token) {
    logger.error('Token is missing');
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decodedToken: any) => {
    if (err) {
      logger.error('Token verification failed:', err);
      return res.status(403).json({ message: 'Invalid token' });
    }

    const user = { name: `${decodedToken.name}`, id: decodedToken.id, email: decodedToken.email, picture: decodedToken.picture };
    logger.info('User verified:', user);
    res.status(200).json({ user: user });
  });
});

export default router;
