require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const path = require('path');

const { initDB } = require('./config/db');
require('./config/passport');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');

const app = express();

// ─── Trust Proxy (Crucial for Railway/Render) ──────────────────────────────────
// Tells Express it is behind a proxy (load balancer) and should trust the X-Forwarded-* headers.
// This ensures req.protocol is 'https' instead of 'http', which fixes OAuth redirects and secure cookies.
app.set('trust proxy', 1);

// ─── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Session (for Passport Google OAuth redirect only) ───────────────────────
// cookie-session stores data in a signed cookie — no server-side store needed,
// no MemoryStore production warning, works perfectly on Railway single containers
app.use(
  cookieSession({
    name: 'taskflow_session',
    secret: process.env.SESSION_SECRET || 'taskflow_session_secret',
    maxAge: 10 * 60 * 1000, // 10 min — only needed for OAuth redirect flow
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  })
);

// Compatibility shim: passport expects req.session.regenerate and req.session.save
app.use((req, res, next) => {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb) => cb();
  }
  if (req.session && !req.session.save) {
    req.session.save = (cb) => cb();
  }
  next();
});

const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── Serve React Frontend in Production ───────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Start listening FIRST so Railway healthcheck passes immediately,
// then connect to DB in the background
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TaskFlow API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // DB init runs after server is already accepting requests
  initDB().catch((err) => {
    console.error('❌ Background DB init error:', err.message);
  });
});

module.exports = app;
