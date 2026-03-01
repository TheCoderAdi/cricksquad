const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    question: {
        type: String,
        required: [true, 'Please provide a question'],
        maxlength: [200, 'Question cannot exceed 200 characters']
    },
    options: [{
        text: {
            type: String,
            required: true
        },
        votes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    deadline: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Check if poll expired
pollSchema.methods.isExpired = function () {
    return new Date() > this.deadline;
};

// Get total votes
pollSchema.methods.getTotalVotes = function () {
    return this.options.reduce((sum, opt) => sum + opt.votes.length, 0);
};

module.exports = mongoose.model('Poll', pollSchema);