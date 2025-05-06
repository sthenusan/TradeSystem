const userService = require('../services/userService');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const { user, items, trades } = await userService.getProfileDataService(req.user.id);
        res.render('profile', { user, items, trades });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, location, bio } = req.body;
        const profilePicture = req.file ? req.file.filename : undefined;
        await userService.updateProfileService(req.user.id, { name, location, bio, profilePicture });
        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
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