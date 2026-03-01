const express = require('express');
const router = express.Router();
const {
    createMatch, getMatch, getGroupMatches, getUpcomingMatch,
    submitRSVP, generateTeams, performToss,
    updateExpenses, markAsPaid, submitScorecard,
    uploadPhotos, deletePhoto, updateMatchStatus
} = require('../controllers/matchController');
const { protect, isGroupAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, isGroupAdmin, createMatch);
router.get('/:id', protect, getMatch);
router.get('/group/:groupId', protect, getGroupMatches);
router.get('/group/:groupId/upcoming', protect, getUpcomingMatch);

// RSVP
router.post('/:id/rsvp', protect, submitRSVP);

// Teams
router.post('/:id/teams/generate', protect, isGroupAdmin, generateTeams);
router.post('/:id/toss', protect, isGroupAdmin, performToss);

// Expenses
router.put('/:id/expenses', protect, isGroupAdmin, updateExpenses);
router.put('/:id/expenses/:userId/pay', protect, markAsPaid);

// Scorecard
router.post('/:id/scorecard', protect, submitScorecard);

// Gallery
router.post('/:id/gallery', protect, upload.array('photos', 10), uploadPhotos);
router.delete('/:matchId/gallery/:photoId', protect, deletePhoto);

// Status
router.put('/:id/status', protect, updateMatchStatus);

module.exports = router;