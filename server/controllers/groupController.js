const Group = require('../models/Group');
const User = require('../models/User');

const createGroup = async (req, res, next) => {
    try {
        const { name, description, maxPlayers, settings } = req.body;

        const group = await Group.create({
            name,
            description,
            maxPlayers,
            settings,
            admin: req.user._id,
            members: [{
                user: req.user._id,
                role: 'admin'
            }]
        });

        // Add group to user's groups
        await User.findByIdAndUpdate(req.user._id, {
            $push: { groups: group._id }
        });

        const populatedGroup = await Group.findById(group._id)
            .populate('members.user', 'name email avatar playerRole overallRating');

        res.status(201).json({
            success: true,
            data: populatedGroup
        });
    } catch (error) {
        next(error);
    }
};

const sendAlert = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id).populate('members.user', 'name email');
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        const { amount, message } = req.body;
        if (!amount && !message) return res.status(400).json({ success: false, message: 'Amount or message required' });

        const sendEmail = require('../utils/sendEmail');
        const subject = `Alert from ${group.name}`;

        // Send to all group members
        const recipients = group.members.map(m => m.user?.email).filter(Boolean);

        const html = `<p>Dear member,</p>
        <p>${req.user.name} (admin of ${group.name}) has posted an alert.</p>
        ${amount ? `<p><strong>Amount:</strong> ₹${amount}</p>` : ''}
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p>Visit the group to take action.</p>`;

        await Promise.all(recipients.map(email => sendEmail({ to: email, subject, html }).catch(err => console.error('Mail error', err))));

        res.status(200).json({ success: true, message: 'Alert sent to group members' });
    } catch (error) {
        next(error);
    }
};

const getGroup = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('members.user', 'name email avatar phone playerRole overallRating battingSkill bowlingSkill fieldingSkill stats attendance')
            .populate('settings.defaultVenue');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is member
        if (!group.isMember(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        res.status(200).json({
            success: true,
            data: group
        });
    } catch (error) {
        next(error);
    }
};

const getMyGroups = async (req, res, next) => {
    try {
        const groups = await Group.find({
            'members.user': req.user._id
        })
            .populate('members.user', 'name avatar')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: groups.length,
            data: groups
        });
    } catch (error) {
        next(error);
    }
};

const joinGroup = async (req, res, next) => {
    try {
        const { code } = req.body;

        const group = await Group.findOne({ code: code.toUpperCase() });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Invalid group code'
            });
        }

        // Check if already a member
        if (group.isMember(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this group'
            });
        }

        // Check if group is full
        if (group.members.length >= group.maxPlayers) {
            return res.status(400).json({
                success: false,
                message: 'Group is full'
            });
        }

        // Add member
        group.members.push({
            user: req.user._id,
            role: 'member'
        });
        await group.save();

        // Add group to user's groups
        await User.findByIdAndUpdate(req.user._id, {
            $push: { groups: group._id }
        });

        const populatedGroup = await Group.findById(group._id)
            .populate('members.user', 'name email avatar playerRole overallRating');

        res.status(200).json({
            success: true,
            message: `Successfully joined ${group.name}!`,
            data: populatedGroup
        });
    } catch (error) {
        next(error);
    }
};

const updateGroup = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (!group.isAdmin(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update group settings'
            });
        }

        const allowedFields = ['name', 'description', 'maxPlayers', 'avatar', 'settings'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                group[field] = req.body[field];
            }
        });

        await group.save();

        res.status(200).json({
            success: true,
            data: group
        });
    } catch (error) {
        next(error);
    }
};

const removeMember = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (!group.isAdmin(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can remove members'
            });
        }

        // Can't remove yourself if you're the only admin
        if (req.params.userId === req.user._id.toString()) {
            const adminCount = group.members.filter(m => m.role === 'admin').length;
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot remove the only admin. Transfer admin role first.'
                });
            }
        }

        group.members = group.members.filter(
            m => m.user.toString() !== req.params.userId
        );
        await group.save();

        // Remove group from user's groups
        await User.findByIdAndUpdate(req.params.userId, {
            $pull: { groups: group._id }
        });

        res.status(200).json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createGroup, getGroup, getMyGroups, joinGroup, updateGroup, removeMember, sendAlert };