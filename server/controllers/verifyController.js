const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const verifyEmail = async (req, res, next) => {
    try {
        const { email, code } = req.query;
        if (!email || !code) {
            return res.status(400).json({ success: false, message: 'Invalid verification request' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.otp || user.otp.code !== code) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        if (user.otp.expiresAt < Date.now()) {
            return res.status(400).json({ success: false, message: 'Verification code has expired' });
        }

        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        res.redirect(`${process.env.CLIENT_URL}/login`);
    } catch (error) {
        next(error);
    }
};

const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ success: false, message: 'User already verified' });

        const code = crypto.randomBytes(3).toString('hex').toUpperCase();
        user.otp = { code, expiresAt: Date.now() + 1000 * 60 * 60 * 24 };
        await user.save();

        const verifyUrl = `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/auth/verify?email=${encodeURIComponent(email)}&code=${code}`;
        const html = `<p>Hi ${user.name},</p>
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify your email</a></p>
        <p>or manually enter the URL in your browser: ${verifyUrl}</p>
        <p>This link expires in 24 hours.</p>`;

        try {
            await sendEmail({ to: email, subject: 'Resend: Verify your CrickSquad account', html });
        } catch (err) {
            console.error('Failed to send verification email:', err.message || err);
        }

        res.status(200).json({ success: true, message: 'Verification email resent' });
    } catch (error) {
        next(error);
    }
};

module.exports = { verifyEmail, resendVerification };
