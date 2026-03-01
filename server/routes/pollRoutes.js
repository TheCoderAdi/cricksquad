const express = require('express');
const router = express.Router();
const { createPoll, getPolls, votePoll, closePoll, deletePoll } = require('../controllers/pollController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createPoll);
router.get('/group/:groupId', protect, getPolls);
router.post('/:id/vote', protect, votePoll);
router.put('/:id/close', protect, closePoll);
router.delete('/:id', protect, deletePoll);

module.exports = router;