require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const passport = require('passport');
const flash = require('connect-flash');
const connectDB = require('./config/db');
const methodOverride = require('method-override');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');
const Item = require('./models/Item');
const Trade = require('./models/Trade');
const Activity = require('./models/Activity');
const Rating = require('./models/Rating');

// Initialize express app
const app = express();

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public', 'uploads', 'profiles');
require('fs').mkdirSync(uploadDir, { recursive: true });

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/barter-trading',
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.currentPage = 'home';  // Default to home
    next();
});

// Passport configuration
passport.use(new LocalStrategy({ usernameField: 'email' },
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email: email });
            if (!user) {
                return done(null, false, { message: 'Incorrect email.' });
            }
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// API Routes
app.use('/api/trades', require('./routes/tradeRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));

// Web Routes
app.use('/trades', require('./routes/tradeRoutes'));
app.use('/items', require('./routes/itemRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/ratings', require('./routes/ratingRoutes'));

// Mount index.js router for root path
app.use('/', require('./routes/index'));

// Root route
app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

// 404 handler
app.use((req, res, next) => {
    if (req.accepts('html')) {
        res.status(404).render('error', {
            title: 'Page Not Found',
            msg: 'The page you are looking for does not exist.',
            error: { status: 404 }
        });
    } else {
        res.status(404).json({
            status: 'error',
            message: 'Not Found'
        });
    }
});

// Global error handler
app.use(require('./middleware/errorHandler'));

// Start server only if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app; 