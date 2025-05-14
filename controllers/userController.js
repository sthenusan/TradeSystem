const userService = require('../services/userService');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

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
        const { firstName, lastName, email, phone, bio, location, website } = req.body;
        const updateData = {
            firstName,
            lastName,
            email,
            phone,
            bio,
            location,
            website
        };

        // Handle profile picture upload
        if (req.file) {
            // Delete old profile picture if it exists
            const user = await User.findById(req.user.id);
            if (user.profilePicture) {
                try {
                    await fs.unlink(path.join(__dirname, '../public/uploads/profiles/', user.profilePicture));
                } catch (err) {
                    console.error('Error deleting old profile picture:', err);
                }
            }
            updateData.profilePicture = req.file.filename;
        }

        await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/users/profile');
    } catch (err) {
        console.error(err);
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
        await userService.deleteAccountService(req.user.id);
        req.logout();
        req.flash('success_msg', 'Your account has been deleted');
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
}; 