const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Activity = require('../models/Activity');

// Home page
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Home',
        currentPage: 'home'
    });
});

// Dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        const recentActivity = await Activity.find({ user: req.user._id })
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('relatedItem', 'title')
            .populate('relatedTrade', 'status');

    res.render('dashboard', {
        title: 'Dashboard',
            user: req.user,
            recentActivity: recentActivity
        });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).render('error', {
            title: 'Error',
            msg: 'Failed to fetch recent activity',
            error: error
    });
    }
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