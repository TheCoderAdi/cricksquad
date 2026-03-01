const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, playerRole } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user (unverified)
        const user = await User.create({
            name,
            email,
            password,
            phone,
            playerRole,
            isVerified: false
        });

        // Generate verification code
        const code = crypto.randomBytes(3).toString('hex').toUpperCase();
        user.otp = { code, expiresAt: Date.now() + 1000 * 60 * 60 * 24 }; // 24 hours
        await user.save();

        // Send verification email
        const verifyUrl = `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/auth/verify?email=${encodeURIComponent(email)}&code=${code}`;
        const html = `<p>Hi ${name},</p>
        <p>Thanks for registering. Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify your email</a></p>
        <p>Or manually enter the URL in your browser: ${verifyUrl}</p>
        <p>This link expires in 24 hours.</p>`;

        try {
            await sendEmail({ to: email, subject: 'Verify your CrickSquad account', html });
        } catch (err) {
            console.error('Failed to send verification email:', err.message || err);
        }

        console.log('User registered (unverified):', user.email);

        res.status(201).json({ success: true, message: 'Registered successfully. Please check your email to verify your account.' });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Block login if not verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Email not verified. Please check your email for a verification link.'
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('groups', 'name code avatar');

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const allowedFields = ['name', 'phone', 'avatar', 'playerRole',
            'battingSkill', 'bowlingSkill', 'fieldingSkill'];

        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(req.user.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = user.generateToken();

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    // Remove password from output
    const userData = user.toObject();
    delete userData.password;

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            data: userData
        });
};

module.exports = { register, login, getMe, updateProfile, logout };
