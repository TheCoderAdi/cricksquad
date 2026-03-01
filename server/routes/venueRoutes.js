const express = require('express');
const router = express.Router();
const { createVenue, getVenues, getVenue, updateVenue, uploadVenuePhotos, deleteVenue } = require('../controllers/venueController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, createVenue);
router.get('/group/:groupId', protect, getVenues);
router.get('/:id', protect, getVenue);
router.put('/:id', protect, updateVenue);
router.post('/:id/photos', protect, upload.array('photos', 5), uploadVenuePhotos);
router.delete('/:id', protect, deleteVenue);

module.exports = router;