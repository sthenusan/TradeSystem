<<<<<<< HEAD
// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI_TEST = 'mongodb://localhost:27017/trade_system_test';
process.env.SESSION_SECRET = 'test_session_secret';
process.env.EMAIL_SERVICE = 'gmail';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test_password';

// Mock console.error to keep test output clean
console.error = jest.fn();

// Increase timeout for tests
jest.setTimeout(30000);

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    })
}));

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

let mongoServer;

// Setup function to configure app for testing
const setupTestApp = async (app) => {
    // Create an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Configure session store to use the test database
    const sessionMiddleware = session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: mongoUri,
            collectionName: 'sessions'
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
            httpOnly: true,
            secure: false, // Set to false for testing
            sameSite: 'lax' // Set to lax for testing
        }
    });

    // Initialize Passport
    app.use(sessionMiddleware);
    app.use(passport.initialize());
    app.use(passport.session());

    // Configure Passport for testing
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

    return app;
};

// Cleanup function to close connections
const cleanup = async () => {
    if (mongoServer) {
        await mongoose.disconnect();
        await mongoServer.stop();
    }
};

module.exports = {
    setupTestApp,
    cleanup
}; 
=======
const mongoose = require('mongoose');

// Connect to test database
beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-system-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

// Clean up database before each test
beforeEach(async () => {
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
        await mongoose.connection.collections[collectionName].deleteMany({});
    }
});

// Close database connection after all tests
afterAll(async () => {
    await mongoose.connection.close();
}); 
>>>>>>> fix/trade-issues
