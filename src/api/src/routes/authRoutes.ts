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
  // Add any other properties your User model has
}

// Google OAuth authentication route
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

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

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string || 'your_jwt_secret', {
      expiresIn: '24h',
    });

    logger.info('Generated JWT:', token);

    // Set the token and user information in cookies
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.cookie('user', JSON.stringify(user), { httpOnly: false });
    res.cookie('isAuthenticated', 'true', { httpOnly: false });

    logger.info("Auth: Set token and user info in cookies");

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

export default router;
