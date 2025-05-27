const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generate 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email with code
const sendVerificationEmail = async (user, verificationCode) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Verify Your Email - Barter Trading System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333; text-align: center;">Email Verification</h1>
                <p>Hello ${user.firstName},</p>
                <p>Your email verification code is:</p>
                <div style="
                    background-color: #f4f4f4;
                    padding: 20px;
                    text-align: center;
                    font-size: 32px;
                    letter-spacing: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                    color: #333;">
                    ${verificationCode}
                </div>
                <p>Enter this code in the verification window to verify your email address.</p>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this code, please ignore this email.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    generateVerificationCode,
    sendVerificationEmail
}; 