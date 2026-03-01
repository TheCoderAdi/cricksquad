const express = require('express');
const router = express.Router();
const { getPlayerStats, getLeaderboard, getRunningBalances, updateSkills } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/:id/stats', protect, getPlayerStats);
router.get('/leaderboard/:groupId', protect, getLeaderboard);
router.get('/balances/:groupId', protect, getRunningBalances);
router.put('/:id/skills', protect, updateSkills);

module.exports = router;