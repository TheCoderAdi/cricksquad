const express = require('express');
const router = express.Router();
const { createAnnouncement, getAnnouncements, markAsRead, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, isGroupAdmin } = require('../middleware/auth');

router.post('/', protect, isGroupAdmin, createAnnouncement);
router.get('/group/:groupId', protect, getAnnouncements);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, isGroupAdmin, deleteAnnouncement);

module.exports = router;