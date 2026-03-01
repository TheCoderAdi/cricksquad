const express = require('express');
const router = express.Router();
const {
    aiBalanceTeams, aiMatchSummary, aiPlayerInsight,
    aiPotmSuggestion, aiSeasonAnalytics, aiSmartReminder
} = require('../controllers/aiController');
const { protect, isGroupAdmin } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);
router.use(aiLimiter);

router.post('/balance-teams', isGroupAdmin, aiBalanceTeams);
router.post('/match-summary', aiMatchSummary);
router.post('/player-insight', aiPlayerInsight);
router.post('/potm-suggestion', aiPotmSuggestion);
router.post('/season-analytics', aiSeasonAnalytics);
router.post('/smart-reminder', aiSmartReminder);

module.exports = router;