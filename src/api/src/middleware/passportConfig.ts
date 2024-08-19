import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      // In a real application, you'd want to associate the Google account with a user record in your database
      done(null, profile);
    }
  )
);

// Serialize and deserialize user instances to and from the session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((id, done) => {
  // If you have a database, fetch the user by ID
  // User.findById(id, (err, user) => {
  //   done(err, user);
  // });

  // Mock implementation if you don't have a database
  const user = { id, name: 'Mock User' }; // Replace with actual user fetching logic
  done(null, user);
});
