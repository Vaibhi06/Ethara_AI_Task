const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// get all users for the admin dashboard
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar, u.role, u.is_approved, u.created_at,
        COUNT(DISTINCT pm.project_id) AS project_count,
        COUNT(DISTINCT t.id) AS task_count
       FROM users u
       LEFT JOIN project_members pm ON pm.user_id = u.id
       LEFT JOIN tasks t ON t.assigned_to = u.id
       GROUP BY u.id ORDER BY u.created_at DESC`
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, name, email, avatar, role, google_id, created_at FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password } = req.body;

    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    let updateQuery, params;
    if (password) {
      const hashed = await bcrypt.hash(password, 12);
      updateQuery = `UPDATE users SET name = COALESCE($1, name), password = $2 WHERE id = $3 RETURNING id, name, email, avatar, role`;
      params = [name?.trim(), hashed, id];
    } else {
      updateQuery = `UPDATE users SET name = COALESCE($1, name) WHERE id = $2 RETURNING id, name, email, avatar, role`;
      params = [name?.trim(), id];
    }

    const result = await pool.query(updateQuery, params);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: 'Profile updated!', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// approve a pending user
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET is_approved = TRUE WHERE id = $1 RETURNING id, name, is_approved`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'User approved successfully!', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getUsers, getUser, updateUser, approveUser };
