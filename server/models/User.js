const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    phone: {
        type: String,
        trim: true
    },
    avatar: {
        type: String,
        default: ''
    },

    // Cricket Profile
    playerRole: {
        type: String,
        enum: ['batsman', 'bowler', 'allrounder', 'keeper'],
        default: 'batsman'
    },
    battingSkill: {
        type: Number,
        min: 1,
        max: 100,
        default: 50
    },
    bowlingSkill: {
        type: Number,
        min: 1,
        max: 100,
        default: 50
    },
    fieldingSkill: {
        type: Number,
        min: 1,
        max: 100,
        default: 50
    },
    overallRating: {
        type: Number,
        min: 1,
        max: 100,
        default: 50
    },

    // Aggregated Stats
    stats: {
        totalMatches: { type: Number, default: 0 },
        totalRuns: { type: Number, default: 0 },
        totalBallsFaced: { type: Number, default: 0 },
        totalWickets: { type: Number, default: 0 },
        totalOversBowled: { type: Number, default: 0 },
        totalRunsConceded: { type: Number, default: 0 },
        totalCatches: { type: Number, default: 0 },
        totalRunOuts: { type: Number, default: 0 },
        totalStumpings: { type: Number, default: 0 },
        totalFours: { type: Number, default: 0 },
        totalSixes: { type: Number, default: 0 },
        highestScore: { type: Number, default: 0 },
        bestBowling: { type: String, default: '0/0' },
        fifties: { type: Number, default: 0 },
        potmAwards: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 }
    },

    // Attendance
    attendance: {
        totalInvited: { type: Number, default: 0 },
        totalAttended: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 }
    },

    // Groups
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],

    // AI cached insights per-group
    aiInsights: [{
        group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
        data: { type: Object },
        lastGeneratedAt: Date
    }],

    // OTP for phone verification
    otp: {
        code: String,
        expiresAt: Date
    },

    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Calculate overall rating before saving
userSchema.pre('save', function () {
    if (this.isModified('battingSkill') || this.isModified('bowlingSkill') || this.isModified('fieldingSkill')) {
        // Weighted average based on role
        const weights = {
            batsman: { batting: 0.5, bowling: 0.2, fielding: 0.3 },
            bowler: { batting: 0.2, bowling: 0.5, fielding: 0.3 },
            allrounder: { batting: 0.35, bowling: 0.35, fielding: 0.3 },
            keeper: { batting: 0.4, bowling: 0.1, fielding: 0.5 }
        };

        const w = weights[this.playerRole] || weights.batsman;
        this.overallRating = Math.round(
            this.battingSkill * w.batting +
            this.bowlingSkill * w.bowling +
            this.fieldingSkill * w.fielding
        );
    }
    console.log(`Calculated overall rating for ${this.name} (${this.playerRole}): ${this.overallRating}`);
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    console.log(`Hashed password for ${this.email}`);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.generateToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// Get attendance percentage
userSchema.methods.getAttendancePercentage = function () {
    if (this.attendance.totalInvited === 0) return 0;
    return Math.round((this.attendance.totalAttended / this.attendance.totalInvited) * 100);
};

// Get batting average
userSchema.methods.getBattingAverage = function () {
    if (this.stats.totalMatches === 0) return 0;
    return (this.stats.totalRuns / this.stats.totalMatches).toFixed(1);
};

// Get bowling average
userSchema.methods.getBowlingAverage = function () {
    if (this.stats.totalWickets === 0) return 0;
    return (this.stats.totalRunsConceded / this.stats.totalWickets).toFixed(1);
};

// Get strike rate
userSchema.methods.getStrikeRate = function () {
    if (this.stats.totalBallsFaced === 0) return 0;
    return ((this.stats.totalRuns / this.stats.totalBallsFaced) * 100).toFixed(1);
};

module.exports = mongoose.model('User', userSchema);