const { pool } = require('../config/db');

const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const memberFilter = `SELECT project_id FROM project_members WHERE user_id = '${userId}'`;
    const taskFilter = isAdmin ? '' : `WHERE project_id IN (${memberFilter})`;
    const projectFilter = isAdmin ? '' : `WHERE id IN (${memberFilter})`;

    const [projectStats, taskStats, tasksByStatus, tasksByPriority, recentTasks] =
      await Promise.all([
        pool.query(`SELECT COUNT(*) AS total FROM projects ${projectFilter}`),
        pool.query(`
          SELECT
            COUNT(*) AS total,
            COUNT(CASE WHEN status = 'done' THEN 1 END) AS done,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress,
            COUNT(CASE WHEN status = 'todo' THEN 1 END) AS todo,
            COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'done' THEN 1 END) AS overdue
          FROM tasks ${taskFilter}
        `),
        pool.query(`SELECT status, COUNT(*) AS count FROM tasks ${taskFilter} GROUP BY status`),
        pool.query(`SELECT priority, COUNT(*) AS count FROM tasks ${taskFilter} GROUP BY priority`),
        pool.query(`
          SELECT t.id, t.title, t.status, t.priority, t.due_date,
            p.name AS project_name, p.color AS project_color,
            u.name AS assignee_name, u.avatar AS assignee_avatar
          FROM tasks t
          LEFT JOIN projects p ON p.id = t.project_id
          LEFT JOIN users u ON u.id = t.assigned_to
          ${isAdmin ? '' : `WHERE t.project_id IN (${memberFilter})`}
          ORDER BY t.created_at DESC LIMIT 5
        `),
      ]);

    res.json({
      success: true,
      stats: {
        projects: parseInt(projectStats.rows[0].total),
        tasks: {
          total: parseInt(taskStats.rows[0].total),
          done: parseInt(taskStats.rows[0].done),
          in_progress: parseInt(taskStats.rows[0].in_progress),
          todo: parseInt(taskStats.rows[0].todo),
          overdue: parseInt(taskStats.rows[0].overdue),
        },
        tasksByStatus: tasksByStatus.rows,
        tasksByPriority: tasksByPriority.rows,
        recentTasks: recentTasks.rows,
      },
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOverdueTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const memberFilter = `SELECT project_id FROM project_members WHERE user_id = '${userId}'`;

    const result = await pool.query(`
      SELECT t.id, t.title, t.status, t.priority, t.due_date,
        p.name AS project_name, p.color AS project_color,
        u.name AS assignee_name, u.avatar AS assignee_avatar,
        (CURRENT_DATE - t.due_date) AS days_overdue
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.due_date < CURRENT_DATE AND t.status != 'done'
      ${!isAdmin ? `AND t.project_id IN (${memberFilter})` : ''}
      ORDER BY t.due_date ASC
    `);

    res.json({ success: true, tasks: result.rows });
  } catch (error) {
    console.error('getOverdueTasks error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getStats, getOverdueTasks };
