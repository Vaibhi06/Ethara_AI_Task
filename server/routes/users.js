const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser } = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);
router.get('/', requireAdmin, getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);

module.exports = router;
