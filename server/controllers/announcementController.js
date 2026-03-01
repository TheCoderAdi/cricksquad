const Announcement = require('../models/Announcement');
const Group = require('../models/Group');
const sendEmail = require('../utils/sendEmail');

const createAnnouncement = async (req, res, next) => {
    try {
        const { groupId, title, message, priority } = req.body;

        const announcement = await Announcement.create({
            group: groupId,
            title,
            message,
            priority: priority || 'normal',
            author: req.user._id
        });

        const populated = await Announcement.findById(announcement._id)
            .populate('author', 'name avatar');

        // Send notification emails to group members
        try {
            const group = await Group.findById(groupId).populate('members.user', 'name email');
            if (group) {
                const recipients = group.members.map(m => m.user?.email).filter(Boolean);
                const subject = `Announcement in ${group.name}: ${title}`;
                const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/groups/${groupId}`;
                const html = `<p>Hi there,</p>
                    <p><strong>${title}</strong></p>
                    <p>${message}</p>
                    <p><a href="${link}">View announcement in group</a></p>`;

                await Promise.all(recipients.map(email => sendEmail({ to: email, subject, html }).catch(err => console.error('Announcement mail error', err))));
            }
        } catch (err) {
            console.error('Failed to send announcement emails:', err);
        }

        res.status(201).json({
            success: true,
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

const getAnnouncements = async (req, res, next) => {
    try {
        const { limit = 20, page = 1 } = req.query;

        const announcements = await Announcement.find({ group: req.params.groupId })
            .populate('author', 'name avatar')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Announcement.countDocuments({ group: req.params.groupId });

        res.status(200).json({
            success: true,
            count: announcements.length,
            total,
            data: announcements
        });
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        if (!announcement.readBy.includes(req.user._id)) {
            announcement.readBy.push(req.user._id);
            await announcement.save();
        }

        res.status(200).json({
            success: true,
            message: 'Marked as read'
        });
    } catch (error) {
        next(error);
    }
};

const deleteAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Announcement deleted'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createAnnouncement, getAnnouncements, markAsRead, deleteAnnouncement };