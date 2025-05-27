const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Activity = require('../models/Activity');

// Import route modules
const tradeRoutes = require('./tradeRoutes');
const userRoutes = require('./userRoutes');
const itemRoutes = require('./itemRoutes');
const notificationRoutes = require('./notificationRoutes');

// Routes
router.use('/trades', tradeRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/notifications', notificationRoutes);

// Home route
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Welcome to Trade System',
        user: req.user
    });
});

// Dashboard route
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        const recentActivity = await Activity.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('relatedTrade', 'status')
            .populate('relatedItem', 'title');
        

    res.render('dashboard', {
        title: 'Dashboard',
            user: req.user,
            recentActivity: recentActivity
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.render('dashboard', {
            title: 'Dashboard',
            user: req.user,
            recentActivity: []
    });
    }
});

// 404 handler
router.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Page Not Found',
        message: 'The page you are looking for does not exist.'
    });
});

async function getRecentActivity(userId) {
    // Fetch recent activities from the database
    // This is a placeholder. Replace with actual logic to fetch activities.
    return [];
}

// About page
router.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Us',
        user: req.user
    });
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Contact Us',
        user: req.user
    });
});

// Terms and conditions
router.get('/terms', (req, res) => {
    res.render('terms', {
        title: 'Terms and Conditions',
        user: req.user
    });
});

// Privacy policy
router.get('/privacy', (req, res) => {
    res.render('privacy', {
        title: 'Privacy Policy',
        user: req.user
    });
});

module.exports = router; 