const mongoose = require('mongoose');
const crypto = require('crypto');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a group name'],
        trim: true,
        maxlength: [50, 'Group name cannot exceed 50 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    code: {
        type: String,
        unique: true
    },
    avatar: {
        type: String,
        default: ''
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    maxPlayers: {
        type: Number,
        default: 30,
        min: 4,
        max: 50
    },
    settings: {
        matchDay: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            default: 'sunday'
        },
        defaultTime: {
            type: String,
            default: '07:00'
        },
        defaultVenue: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Venue'
        },
        rsvpDeadlineHours: {
            type: Number,
            default: 12 // hours before match
        },
        minPlayers: {
            type: Number,
            default: 12
        },
        maxPlayersPerMatch: {
            type: Number,
            default: 22
        },
        defaultOvers: {
            type: Number,
            default: 20
        }
    },

    // Season tracking
    currentSeason: {
        name: { type: String, default: 'Season 1' },
        startDate: { type: Date, default: Date.now },
        matchesPlayed: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Generate unique join code before saving
groupSchema.pre('save', function () {
    if (!this.code) {
        this.code = crypto.randomBytes(3).toString('hex').toUpperCase();
    } else return;
});

// Get member count
groupSchema.methods.getMemberCount = function () {
    return this.members.length;
};

// Check if user is member
groupSchema.methods.isMember = function (userId) {
    return this.members.some(m => m.user.toString() === userId.toString());
};

// Check if user is admin
groupSchema.methods.isAdmin = function (userId) {
    const member = this.members.find(m => m.user.toString() === userId.toString());
    return member && member.role === 'admin';
};

module.exports = mongoose.model('Group', groupSchema);