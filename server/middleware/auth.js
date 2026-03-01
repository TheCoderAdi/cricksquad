const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

const isGroupAdmin = async (req, res, next) => {
    try {
        const groupId = req.body.groupId || req.params.id || req.query.groupId;

        if (!groupId) {
            return res.status(400).json({ success: false, message: 'groupId is required' });
        }

        const group = await Group.findById(groupId);

        console.log('Group ID:', groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        const member = group.members.find(
            m => m.user.toString() === req.user._id.toString()
        );

        if (!member || member.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only group admins can perform this action'
            });
        }

        req.group = group;
        next();
    } catch (error) {
        next(error);
    }
};


module.exports = { protect, isGroupAdmin };