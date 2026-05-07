const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

// local strategy (email + password)
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email.toLowerCase()]
        );
        const user = result.rows[0];

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.is_approved && user.role !== 'admin') {
          return done(null, false, { message: 'Your account is pending admin approval.' });
        }

        if (!user.password) {
          return done(null, false, {
            message: 'This account uses Google Sign-In. Please login with Google.',
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// google oauth strategy
// Only register if credentials are present (prevents crash when env vars not set)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Using absolute URL prevents http/https mismatch issues behind Railway's proxy
        callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const avatar = profile.photos?.[0]?.value;
          const name = profile.displayName;
          const googleId = profile.id;

          // Check if user already exists by google_id
          let result = await pool.query(
            'SELECT * FROM users WHERE google_id = $1',
            [googleId]
          );

          if (result.rows.length > 0) {
            return done(null, result.rows[0]);
          }

          // Check if user exists by email (link accounts)
          result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );

          if (result.rows.length > 0) {
            // Link Google account to existing user
            const updated = await pool.query(
              'UPDATE users SET google_id = $1, avatar = COALESCE(avatar, $2) WHERE email = $3 RETURNING *',
              [googleId, avatar, email]
            );
            return done(null, updated.rows[0]);
          }

          // Create new user (Google users are auto-approved per user request)
          const newUser = await pool.query(
            `INSERT INTO users (name, email, google_id, avatar, role, is_approved)
             VALUES ($1, $2, $3, $4, 'member', TRUE) RETURNING *`,
            [name, email, googleId, avatar]
          );

          return done(null, newUser.rows[0]);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy registered');
} else {
  console.warn('⚠️  GOOGLE_CLIENT_ID not set — Google Sign-In disabled. Set it in Railway Variables.');
}


// session serialization
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
