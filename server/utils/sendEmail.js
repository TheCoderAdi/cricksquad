const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async ({ to, subject, html, text }) => {
    const from = process.env.MAIL_FROM || process.env.EMAIL_USER;
    const mailOptions = {
        from,
        to,
        subject,
        text: text || '',
        html: html || ''
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
