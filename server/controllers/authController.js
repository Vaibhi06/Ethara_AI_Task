const bcrypt = require('bcryptjs');
const passport = require('passport');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/jwtUtils');

// handle user registration
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (unapproved by default)
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, is_approved)
       VALUES ($1, $2, $3, 'member', FALSE) RETURNING id, name, email, avatar, role, created_at`,
      [name.trim(), email.toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];
    // Do not return token yet — they need approval
    res.status(201).json({
      success: true,
      message: 'Account created! Please wait for admin approval before logging in.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// login handler
const login = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid credentials.',
      });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  })(req, res, next);
};

// oauth callback from google
const googleCallback = (req, res) => {
  try {
    const user = req.user;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // Google users are auto-approved, generate token directly
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // Redirect to frontend with token in URL param
    res.redirect(`${clientUrl}/auth/google/callback?token=${token}`);
  } catch (error) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/login?error=google_auth_failed`);
  }
};

// get current user info
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar, u.role, u.google_id, u.created_at,
        (SELECT COUNT(*) FROM project_members WHERE user_id = u.id) AS project_count,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = u.id) AS task_count
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// logout handler
const logout = (req, res) => {
  // JWT is stateless — client deletes token
  res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { register, login, googleCallback, getMe, logout };
