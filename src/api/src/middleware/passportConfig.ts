import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AccountType, PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await prisma.user.upsert({
          where: { email: profile.emails ? profile.emails[0].value : '' },
          update: {
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            picture: profile.photos ? profile.photos[0].value : '',
          },
          create: {
            qid : profile.id,
            accountType: AccountType.google,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            email: profile.emails ? profile.emails[0].value : '',
            picture: profile.photos ? profile.photos[0].value : '',
          },
        });
        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

// Serialize and deserialize user instances to and from the session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (authUser : User, done) => {
  const user = await prisma.user.findFirst({
    where: { qid: authUser.qid as string },
  });
  done(null, user);
});
