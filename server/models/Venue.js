const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide venue name'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Please provide venue address']
    },
    googleMapsLink: {
        type: String,
        default: ''
    },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    phone: {
        type: String,
        default: ''
    },
    pricePerHour: {
        type: Number,
        default: 0
    },
    facilities: [{
        type: String,
        enum: ['parking', 'washroom', 'floodlights', 'drinking_water',
            'changing_room', 'equipment', 'first_aid', 'canteen']
    }],
    photos: [{ type: String }],
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Venue', venueSchema);