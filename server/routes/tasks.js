const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask,
} = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTask);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project_id').isUUID().withMessage('Valid project ID required'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('due_date').optional().isDate().withMessage('Valid date required (YYYY-MM-DD)'),
  ],
  handleValidationErrors,
  createTask
);

router.put(
  '/:id',
  [
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('due_date').optional().isDate(),
  ],
  handleValidationErrors,
  updateTask
);

router.patch(
  '/:id/status',
  [body('status').isIn(['todo', 'in_progress', 'done']).withMessage('Valid status required')],
  handleValidationErrors,
  updateTaskStatus
);

router.delete('/:id', deleteTask);

module.exports = router;
