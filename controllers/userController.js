const userService = require('../services/userService');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { generateVerificationCode, sendVerificationEmail } = require('../services/emailService');
const transporter = require('../services/emailService').transporter;

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.render('users/profile', {
            title: 'Edit Profile',
            user
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading profile');
        res.redirect('/dashboard');
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { 
            firstName, lastName, email, phone, bio, location, website,
            currentPassword, newPassword, confirmNewPassword 
        } = req.body;

        // Get current user
        const user = await User.findById(req.user.id);
        console.log('[DEBUG] Loaded user:', user ? user.email : 'not found');
        
        // Check if email is being changed and if it's already taken
        if (email !== user.email) {
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                req.flash('error_msg', 'Email is already registered');
                return res.redirect('/users/profile');
            }
        }

        // Basic update data
        const updateData = {};
        
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email.toLowerCase();
        if (phone) updateData.phone = phone;
        if (bio) updateData.bio = bio;
        if (location) updateData.location = location;
        if (website) updateData.website = website;

        // Handle password change if requested
        if (currentPassword && newPassword) {
            // Validate current password
            const isMatch = await user.comparePassword(currentPassword);
            console.log('[DEBUG] Current password match:', isMatch);
            if (!isMatch) {
                req.flash('error_msg', 'Current password is incorrect');
                return res.redirect('/users/profile');
            }

            // Validate new password
            if (newPassword !== confirmNewPassword) {
                req.flash('error_msg', 'New passwords do not match');
                return res.redirect('/users/profile');
            }

            // Validate password complexity
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                req.flash('error_msg', 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character');
                return res.redirect('/users/profile');
            }

            // Update password directly on the user object
            user.password = newPassword;
            await user.save();
            console.log('[DEBUG] Password updated and saved for user:', user.email);
        }

        // Handle profile picture upload
        if (req.file) {
            // Validate file size (1MB limit)
            if (req.file.size > 1000000) {
                req.flash('error_msg', 'Profile picture must be less than 1MB');
                return res.redirect('/users/profile');
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                req.flash('error_msg', 'Only JPG, PNG, and GIF files are allowed');
                return res.redirect('/users/profile');
            }

            // Delete old profile picture if it exists and isn't the default
            if (user.profilePicture && user.profilePicture !== 'default-profile.png') {
                try {
                    await fs.unlink(path.join(__dirname, '../public/uploads/profiles/', user.profilePicture));
                } catch (err) {
                    console.error('Error deleting old profile picture:', err);
                }
            }
            updateData.profilePicture = req.file.filename;
        }

        // Update other user data
        if (Object.keys(updateData).length > 0) {
            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { $set: updateData },
                { new: true }
            );

            if (!updatedUser) {
                req.flash('error_msg', 'Error updating profile');
                return res.redirect('/users/profile');
            }
        }

        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/users/profile');
    } catch (err) {
        console.error('Error updating profile:', err);
        req.flash('error_msg', 'Error updating profile');
        res.redirect('/users/profile');
    }
};

// Get user's items
exports.getUserItems = async (req, res) => {
    try {
        const items = await userService.getUserItemsService(req.user.id);
        res.render('items/my-items', { items });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Get user's trades
exports.getUserTrades = async (req, res) => {
    try {
        const trades = await userService.getUserTradesService(req.user.id);
        res.render('trades/my-trades', { trades });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
    try {
        // Get user to delete their profile picture
        const user = await User.findById(req.user.id);
        
        // Delete profile picture if it exists and isn't the default
        if (user.profilePicture && user.profilePicture !== 'default-profile.png') {
            try {
                await fs.unlink(path.join(__dirname, '../public/uploads/profiles/', user.profilePicture));
            } catch (err) {
                console.error('Error deleting profile picture:', err);
            }
        }

        await userService.deleteAccountService(req.user.id);
        req.logout((err) => {
            if (err) {
                console.error('Error logging out:', err);
            }
            req.flash('success_msg', 'Your account has been deleted');
            res.redirect('/');
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting account');
        res.redirect('/users/profile');
    }
};

// Send verification email
exports.sendVerificationEmail = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.isEmailVerified) {
            return res.json({ 
                status: 'error',
                message: 'Your email is already verified'
            });
        }

        // Generate new verification code
        const code = generateVerificationCode();
        const codeExpiry = new Date();
        codeExpiry.setMinutes(codeExpiry.getMinutes() + 10); // Code expires in 10 minutes

        // Save code to user
        user.verificationCode = code;
        user.verificationCodeExpires = codeExpiry;
        await user.save();
        
        // Send verification email
        await sendVerificationEmail(user, code);

        res.json({
            status: 'success',
            message: 'Verification code sent. Please check your email.'
        });
    } catch (err) {
        console.error('Error sending verification email:', err);
        res.json({
            status: 'error',
            message: 'Error sending verification code'
        });
    }
};

// Verify email with code
exports.verifyEmailWithCode = async (req, res) => {
    try {
        const { code } = req.body;
        
        // Find user with matching code that hasn't expired
        const user = await User.findOne({
            _id: req.user.id,
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.json({
                status: 'error',
                message: 'Invalid or expired verification code'
            });
        }

        // Update user verification status
        user.isEmailVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.json({
            status: 'success',
            message: 'Email verified successfully!'
        });
    } catch (err) {
        console.error('Error verifying email:', err);
        res.json({
            status: 'error',
            message: 'Error verifying email'
        });
    }
}; 