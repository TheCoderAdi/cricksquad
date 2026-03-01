const Venue = require('../models/Venue');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const createVenue = async (req, res, next) => {
    try {
        const { name, address, googleMapsLink, coordinates, phone, pricePerHour, facilities, groupId } = req.body;

        const venue = await Venue.create({
            name,
            address,
            googleMapsLink,
            coordinates,
            phone,
            pricePerHour,
            facilities,
            group: groupId,
            addedBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: venue
        });
    } catch (error) {
        next(error);
    }
};

const getVenues = async (req, res, next) => {
    try {
        const venues = await Venue.find({ group: req.params.groupId })
            .populate('addedBy', 'name avatar')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: venues.length,
            data: venues
        });
    } catch (error) {
        next(error);
    }
};

const getVenue = async (req, res, next) => {
    try {
        const venue = await Venue.findById(req.params.id)
            .populate('addedBy', 'name avatar');

        if (!venue) {
            return res.status(404).json({ success: false, message: 'Venue not found' });
        }

        res.status(200).json({
            success: true,
            data: venue
        });
    } catch (error) {
        next(error);
    }
};

const updateVenue = async (req, res, next) => {
    try {
        const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!venue) {
            return res.status(404).json({ success: false, message: 'Venue not found' });
        }

        res.status(200).json({
            success: true,
            data: venue
        });
    } catch (error) {
        next(error);
    }
};

const uploadVenuePhotos = async (req, res, next) => {
    try {
        const venue = await Venue.findById(req.params.id);

        if (!venue) {
            return res.status(404).json({ success: false, message: 'Venue not found' });
        }

        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `cricksquad/venues/${venue._id}`,
                        transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result.secure_url);
                    }
                );
                streamifier.createReadStream(file.buffer).pipe(stream);
            });
        });

        const urls = await Promise.all(uploadPromises);
        venue.photos.push(...urls);
        await venue.save();

        res.status(200).json({
            success: true,
            data: venue
        });
    } catch (error) {
        next(error);
    }
};

const deleteVenue = async (req, res, next) => {
    try {
        const venue = await Venue.findByIdAndDelete(req.params.id);

        if (!venue) {
            return res.status(404).json({ success: false, message: 'Venue not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Venue deleted'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createVenue, getVenues, getVenue, updateVenue, uploadVenuePhotos, deleteVenue };