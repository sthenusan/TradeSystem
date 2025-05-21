module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated && req.isAuthenticated()) {
            return next();
        }
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.flash('error_msg', 'Please log in to view this resource');
        res.redirect('/users/login');
    },

    forwardAuthenticated: function (req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/dashboard');
    }
}; 