const { pool } = require('../config/db');

// ─── Check if user is a member of a project ───────────────────────────────────
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project_id;
    const userId = req.user.id;

    // System admins bypass project-level checks
    if (req.user.role === 'admin') {
      req.projectRole = 'admin';
      return next();
    }

    const result = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project.',
      });
    }

    req.projectRole = result.rows[0].role; // 'admin' or 'member'
    next();
  } catch (error) {
    next(error);
  }
};

// ─── Check if user is project-level admin ─────────────────────────────────────
const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project_id;
    const userId = req.user.id;

    // System admins bypass project-level checks
    if (req.user.role === 'admin') {
      req.projectRole = 'admin';
      return next();
    }

    const result = await pool.query(
      "SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'admin'",
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Project admin role required.',
      });
    }

    req.projectRole = 'admin';
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireProjectMember, requireProjectAdmin };
