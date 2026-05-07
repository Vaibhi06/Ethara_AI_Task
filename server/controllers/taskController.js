const { pool } = require('../config/db');

// fetch tasks with optional filters
const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { project_id, status, priority, assigned_to, search } = req.query;

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Base filter: admins see all, members see only their projects' tasks
    if (!isAdmin) {
      conditions.push(`
        t.project_id IN (
          SELECT project_id FROM project_members WHERE user_id = $${paramIndex}
        )
      `);
      params.push(userId);
      paramIndex++;
    }

    if (project_id) {
      conditions.push(`t.project_id = $${paramIndex}`);
      params.push(project_id);
      paramIndex++;
    }
    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (priority) {
      conditions.push(`t.priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }
    if (assigned_to) {
      conditions.push(`t.assigned_to = $${paramIndex}`);
      params.push(assigned_to);
      paramIndex++;
    }
    if (search) {
      conditions.push(`t.title ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // build the query
    // TODO: need to refactor this eventually, it's getting huge

    const query = `
      SELECT
        t.*,
        p.name AS project_name,
        p.color AS project_color,
        assignee.name AS assignee_name,
        assignee.avatar AS assignee_avatar,
        creator.name AS created_by_name
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN users assignee ON assignee.id = t.assigned_to
      LEFT JOIN users creator ON creator.id = t.created_by
      ${whereClause}
      ORDER BY
        CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `;

    const result = await pool.query(query, params);
    res.json({ success: true, tasks: result.rows });
  } catch (error) {
    console.error('getTasks error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// get a single task
const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        t.*,
        p.name AS project_name,
        p.color AS project_color,
        assignee.name AS assignee_name,
        assignee.avatar AS assignee_avatar,
        assignee.email AS assignee_email,
        creator.name AS created_by_name
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users assignee ON assignee.id = t.assigned_to
       LEFT JOIN users creator ON creator.id = t.created_by
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, task: result.rows[0] });
  } catch (error) {
    console.error('getTask error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// create new task
const createTask = async (req, res) => {
  try {
    const { title, description, project_id, assigned_to, priority, due_date, status } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title.trim(),
        description?.trim() || null,
        project_id,
        assigned_to || null,
        userId,
        priority || 'medium',
        due_date || null,
        status || 'todo',
      ]
    );

    // Fetch full task with relations
    const fullTask = await pool.query(
      `SELECT t.*, p.name AS project_name, p.color AS project_color,
        a.name AS assignee_name, a.avatar AS assignee_avatar
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users a ON a.id = t.assigned_to
       WHERE t.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      task: fullTask.rows[0],
    });
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// full task update
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, priority, due_date, status } = req.body;

    const result = await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        assigned_to = $3,
        priority = COALESCE($4, priority),
        due_date = $5,
        status = COALESCE($6, status)
       WHERE id = $7 RETURNING *`,
      [
        title?.trim(),
        description?.trim(),
        assigned_to !== undefined ? assigned_to : null,
        priority,
        due_date !== undefined ? due_date : null,
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({
      success: true,
      message: 'Task updated successfully!',
      task: result.rows[0],
    });
  } catch (error) {
    console.error('err updating task:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// update just the status (used for drag and drop)
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Members can only update tasks assigned to them
    if (!isAdmin) {
      const task = await pool.query(
        'SELECT assigned_to, project_id FROM tasks WHERE id = $1',
        [id]
      );

      if (task.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
      }

      // Check project membership
      const membership = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [task.rows[0].project_id, userId]
      );

      if (membership.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      // Members can only update their own assigned tasks
      if (membership.rows[0].role === 'member' && task.rows[0].assigned_to !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update status of tasks assigned to you.',
        });
      }
    }

    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Task status updated!',
      task: result.rows[0],
    });
  } catch (error) {
    console.error('updateTaskStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
