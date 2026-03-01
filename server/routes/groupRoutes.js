const express = require('express');
const router = express.Router();
const { createGroup, getGroup, getMyGroups, joinGroup, updateGroup, removeMember, sendAlert } = require('../controllers/groupController');
const { protect } = require('../middleware/auth');
const { isGroupAdmin } = require('../middleware/auth');

router.route('/')
    .get(protect, getMyGroups)
    .post(protect, createGroup);

router.post('/join', protect, joinGroup);

router.route('/:id')
    .get(protect, getGroup)
    .put(protect, updateGroup);

router.delete('/:id/members/:userId', protect, removeMember);

// Admin alert endpoint
router.post('/:id/alert', protect, isGroupAdmin, sendAlert);

module.exports = router;