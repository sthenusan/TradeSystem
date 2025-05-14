const express = require('express');
const router = express.Router();
const passport = require('passport');
const { forwardAuthenticated, ensureAuthenticated } = require('../middleware/auth');
const userController = require('../controllers/userController');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/profiles');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Login page
router.get('/login', forwardAuthenticated, (req, res) => {
    res.render('users/login', {
        title: 'Login'
    });
});

// Register page
router.get('/register', forwardAuthenticated, (req, res) => {
    res.render('users/register', {
        title: 'Register'
    });
});

// Register handle
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, terms } = req.body;
        let errors = [];

        // Check required fields
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            errors.push({ msg: 'Please fill in all required fields' });
        }

        // Check terms acceptance
        if (!terms) {
            errors.push({ msg: 'You must accept the Terms of Service and Privacy Policy' });
        }

        // Check passwords match
        if (password !== confirmPassword) {
            errors.push({ msg: 'Passwords do not match' });
        }

        // Check password length
        if (password.length < 8) {
            errors.push({ msg: 'Password must be at least 8 characters long' });
        }

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push({ msg: 'Please enter a valid email address' });
        }

        if (errors.length > 0) {
            return res.render('users/register', {
                title: 'Register',
                errors,
                firstName,
                lastName,
                email
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            errors.push({ msg: 'Email is already registered' });
            return res.render('users/register', {
                title: 'Register',
                errors,
                firstName,
                lastName,
                email
            });
        }

        // Create new user
        const newUser = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password
        });

        await newUser.save();
        
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/users/login');
    } catch (err) {
        console.error('Registration error:', err);
        req.flash('error_msg', 'An error occurred during registration');
        res.redirect('/users/register');
    }
});

// Login handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Logout handle
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});

// Profile routes
router.get('/profile', ensureAuthenticated, userController.getProfile);
router.post('/profile', ensureAuthenticated, upload.single('profilePicture'), userController.updateProfile);
router.get('/profile/items', ensureAuthenticated, userController.getUserItems);
router.get('/profile/trades', ensureAuthenticated, userController.getUserTrades);
router.delete('/profile', ensureAuthenticated, userController.deleteAccount);

module.exports = router; 