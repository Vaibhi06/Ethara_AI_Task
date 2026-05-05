const { pool } = require('../config/db');

// ─── Get All Projects (for current user) ──────────────────────────────────────
const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query, params;

    if (isAdmin) {
      // Admins see all projects
      query = `
        SELECT p.*,
          u.name AS created_by_name,
          COUNT(DISTINCT pm.user_id) AS member_count,
          COUNT(DISTINCT t.id) AS task_count,
          COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS done_count
        FROM projects p
        LEFT JOIN users u ON u.id = p.created_by
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id, u.name
        ORDER BY p.created_at DESC
      `;
      params = [];
    } else {
      // Members see only their projects
      query = `
        SELECT p.*,
          u.name AS created_by_name,
          pm_self.role AS my_role,
          COUNT(DISTINCT pm.user_id) AS member_count,
          COUNT(DISTINCT t.id) AS task_count,
          COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS done_count
        FROM projects p
        INNER JOIN project_members pm_self ON pm_self.project_id = p.id AND pm_self.user_id = $1
        LEFT JOIN users u ON u.id = p.created_by
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id, u.name, pm_self.role
        ORDER BY p.created_at DESC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.json({ success: true, projects: result.rows });
  } catch (error) {
    console.error('getProjects error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Get Single Project ────────────────────────────────────────────────────────
const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await pool.query(
      `SELECT p.*, u.name AS created_by_name
       FROM projects p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id = $1`,
      [id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const members = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar, pm.role, pm.joined_at
       FROM project_members pm
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at ASC`,
      [id]
    );

    res.json({
      success: true,
      project: { ...project.rows[0], members: members.rows },
    });
  } catch (error) {
    console.error('getProject error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Create Project ────────────────────────────────────────────────────────────
const createProject = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `INSERT INTO projects (name, description, color, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), description?.trim() || null, color || '#7c3aed', userId]
    );

    const project = result.rows[0];

    // Auto-add creator as project admin
    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [project.id, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully!',
      project,
    });
  } catch (error) {
    console.error('createProject error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Update Project ────────────────────────────────────────────────────────────
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const result = await pool.query(
      `UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        color = COALESCE($3, color)
       WHERE id = $4 RETURNING *`,
      [name?.trim(), description?.trim(), color, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.json({
      success: true,
      message: 'Project updated successfully!',
      project: result.rows[0],
    });
  } catch (error) {
    console.error('updateProject error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Delete Project ────────────────────────────────────────────────────────────
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('deleteProject error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Add Member to Project ─────────────────────────────────────────────────────
const addMember = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { email, role = 'member' } = req.body;

    // Find user by email
    const userResult = await pool.query(
      'SELECT id, name, email, avatar FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address.',
      });
    }

    const user = userResult.rows[0];

    // Check if already a member
    const existing = await pool.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this project.',
      });
    }

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectId, user.id, role]
    );

    res.status(201).json({
      success: true,
      message: `${user.name} added to project successfully!`,
      member: { ...user, role },
    });
  } catch (error) {
    console.error('addMember error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Remove Member from Project ────────────────────────────────────────────────
const removeMember = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    // Prevent removing the creator
    const project = await pool.query('SELECT created_by FROM projects WHERE id = $1', [projectId]);
    if (project.rows[0]?.created_by === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project creator.',
      });
    }

    const result = await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found in project.' });
    }

    res.json({ success: true, message: 'Member removed successfully.' });
  } catch (error) {
    console.error('removeMember error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
