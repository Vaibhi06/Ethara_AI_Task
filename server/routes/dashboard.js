const express = require('express');
const router = express.Router();
const { getStats, getOverdueTasks } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/stats', getStats);
router.get('/overdue', getOverdueTasks);

module.exports = router;
