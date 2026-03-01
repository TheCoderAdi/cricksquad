const mongoose = require('mongoose');

const battingStatSchema = new mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    howOut: { type: String, default: 'not out' }
}, { _id: false });

const bowlingStatSchema = new mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    overs: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 }
}, { _id: false });

const fieldingStatSchema = new mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    catches: { type: Number, default: 0 },
    runOuts: { type: Number, default: 0 },
    stumpings: { type: Number, default: 0 }
}, { _id: false });

const matchSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },

    // Schedule
    date: {
        type: Date,
        required: [true, 'Please provide a match date']
    },
    time: {
        type: String,
        required: [true, 'Please provide a match time']
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    overs: {
        type: Number,
        default: 20
    },
    status: {
        type: String,
        enum: ['upcoming', 'rsvp_open', 'teams_set', 'in_progress', 'completed', 'cancelled'],
        default: 'rsvp_open'
    },
    rsvpDeadline: {
        type: Date,
        required: true
    },

    // RSVP
    rsvps: [{
        player: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['yes', 'no', 'maybe'],
            required: true
        },
        respondedAt: {
            type: Date,
            default: Date.now
        }
    }],
    waitlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Teams
    teamA: {
        name: { type: String, default: 'Team A' },
        players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        totalRating: { type: Number, default: 0 }
    },
    teamB: {
        name: { type: String, default: 'Team B' },
        players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        totalRating: { type: Number, default: 0 }
    },
    toss: {
        winner: { type: String, enum: ['teamA', 'teamB', null], default: null },
        decision: { type: String, enum: ['bat', 'bowl', null], default: null }
    },

    // Expenses
    expenses: {
        totalCost: { type: Number, default: 0 },
        perPersonCost: { type: Number, default: 0 },
        payments: [{
            player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            amount: { type: Number, default: 0 },
            paid: { type: Boolean, default: false },
            paidAt: Date
        }]
    },

    // Scorecard
    scorecard: {
        teamAScore: {
            runs: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
            overs: { type: Number, default: 0 }
        },
        teamBScore: {
            runs: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
            overs: { type: Number, default: 0 }
        },
        winner: {
            type: String,
            enum: ['teamA', 'teamB', 'tie', null],
            default: null
        },
        playerOfMatch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        battingStats: [battingStatSchema],
        bowlingStats: [bowlingStatSchema],
        fieldingStats: [fieldingStatSchema]
    },

    // Gallery
    photos: [{
        url: String,
        publicId: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        caption: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now }
    }],

    // AI Generated Content
    aiSummary: { type: String, default: '' },
    aiHighlights: [{ type: String }],

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Get confirmed players count
matchSchema.methods.getConfirmedCount = function () {
    return this.rsvps.filter(r => r.status === 'yes').length;
};

// Get pending count
matchSchema.methods.getPendingCount = function (totalMembers) {
    const responded = this.rsvps.length;
    return totalMembers - responded;
};

// Check if RSVP deadline passed
matchSchema.methods.isRsvpClosed = function () {
    return new Date() > this.rsvpDeadline;
};

// Index for efficient queries
matchSchema.index({ group: 1, date: -1 });
matchSchema.index({ status: 1 });

module.exports = mongoose.model('Match', matchSchema);