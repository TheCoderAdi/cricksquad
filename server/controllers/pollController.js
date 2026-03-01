const Poll = require('../models/Poll');
const Group = require('../models/Group');
const sendEmail = require('../utils/sendEmail');

const createPoll = async (req, res, next) => {
    try {
        const { groupId, question, options, deadline } = req.body;

        const formattedOptions = options.map(opt => ({
            text: typeof opt === 'string' ? opt : opt.text,
            votes: []
        }));

        const poll = await Poll.create({
            group: groupId,
            question,
            options: formattedOptions,
            deadline,
            createdBy: req.user._id
        });

        const populatedPoll = await Poll.findById(poll._id)
            .populate('createdBy', 'name avatar');

        // Notify group members about the new poll
        try {
            const group = await Group.findById(groupId).populate('members.user', 'name email');
            if (group) {
                const recipients = group.members.map(m => m.user?.email).filter(Boolean);
                const subject = `New poll in ${group.name}: ${question}`;
                const pollLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/groups/${groupId}/polls/${populatedPoll._id}`;
                const html = `<p>Hi there,</p>
                    <p>A new poll has been created in <strong>${group.name}</strong>:</p>
                    <p><strong>${question}</strong></p>
                    <p>Please cast your vote before ${deadline || 'the deadline'}.</p>
                    <p><a href="${pollLink}">View and vote on the poll</a></p>`;

                await Promise.all(recipients.map(email => sendEmail({ to: email, subject, html }).catch(err => console.error('Poll mail error', err))));
            }
        } catch (err) {
            console.error('Failed to send poll emails:', err);
        }

        res.status(201).json({
            success: true,
            data: populatedPoll
        });
    } catch (error) {
        next(error);
    }
};

const getPolls = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = { group: req.params.groupId };

        if (status) query.status = status;

        const polls = await Poll.find(query)
            .populate('createdBy', 'name avatar')
            .populate('options.votes', 'name avatar')
            .sort('-createdAt');

        // Auto-close expired polls
        for (const poll of polls) {
            if (poll.status === 'active' && poll.isExpired()) {
                poll.status = 'closed';
                await poll.save();
            }
        }

        res.status(200).json({
            success: true,
            count: polls.length,
            data: polls
        });
    } catch (error) {
        next(error);
    }
};

const votePoll = async (req, res, next) => {
    try {
        const { optionIndex } = req.body;
        const poll = await Poll.findById(req.params.id);

        if (!poll) {
            return res.status(404).json({ success: false, message: 'Poll not found' });
        }

        if (poll.status === 'closed' || poll.isExpired()) {
            return res.status(400).json({ success: false, message: 'Poll is closed' });
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ success: false, message: 'Invalid option' });
        }

        // Remove previous vote if any
        for (const option of poll.options) {
            option.votes = option.votes.filter(
                v => v.toString() !== req.user._id.toString()
            );
        }

        // Add new vote
        poll.options[optionIndex].votes.push(req.user._id);
        await poll.save();

        const updatedPoll = await Poll.findById(poll._id)
            .populate('options.votes', 'name avatar')
            .populate('createdBy', 'name avatar');

        res.status(200).json({
            success: true,
            message: 'Vote recorded',
            data: updatedPoll
        });
    } catch (error) {
        next(error);
    }
};

const closePoll = async (req, res, next) => {
    try {
        const poll = await Poll.findById(req.params.id);

        if (!poll) {
            return res.status(404).json({ success: false, message: 'Poll not found' });
        }

        poll.status = 'closed';
        await poll.save();

        res.status(200).json({
            success: true,
            message: 'Poll closed',
            data: poll
        });
    } catch (error) {
        next(error);
    }
};

const deletePoll = async (req, res, next) => {
    try {
        const poll = await Poll.findByIdAndDelete(req.params.id);

        if (!poll) {
            return res.status(404).json({ success: false, message: 'Poll not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Poll deleted'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createPoll, getPolls, votePoll, closePoll, deletePoll };