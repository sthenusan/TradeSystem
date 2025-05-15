const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Home page
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Home',
        currentPage: 'home'
    });
});

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard', {
        title: 'Dashboard',
        user: req.user
    });
});

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