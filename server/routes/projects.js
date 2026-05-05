const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember,
} = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/rbac');
const { handleValidationErrors } = require('../middleware/validate');

router.use(authenticate);

router.get('/', getProjects);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  handleValidationErrors,
  createProject
);

router.get('/:id', requireProjectMember, getProject);

router.put(
  '/:id',
  requireProjectAdmin,
  [body('name').optional().trim().notEmpty()],
  handleValidationErrors,
  updateProject
);

router.delete('/:id', requireProjectAdmin, deleteProject);

router.post(
  '/:id/members',
  requireProjectAdmin,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  ],
  handleValidationErrors,
  addMember
);

router.delete('/:id/members/:userId', requireProjectAdmin, removeMember);

module.exports = router;
