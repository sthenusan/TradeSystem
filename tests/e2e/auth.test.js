const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const User = require('../../models/User');

let app;

beforeAll(async () => {
    // Create Express app for testing
    app = express();
    // Set up view engine
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../../views'));
    // Body parser
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    // Express session
    app.use(session({
        secret: 'test-secret',
        resave: true,
        saveUninitialized: true
    }));
    // Passport middleware
    app.use(passport.initialize());
    app.use(passport.session());
    // Connect flash
    app.use(flash());
    // Global variables
    app.use((req, res, next) => {
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        res.locals.error = req.flash('error');
        next();
    });
    // Page context middleware
    app.use((req, res, next) => {
        res.locals.user = req.user || null;
        const path = req.path;
        res.locals.currentPage = path.split('/')[1] || '';
        next();
    });
    // Configure passport
    require('../../config/passport')(passport);
    // Routes
    app.use('/users', require('../../routes/userRoutes'));
});

afterAll(async () => {
    // Error handler for tests
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});

beforeEach(async () => {
    // Clear the users collection before each test
    await User.deleteMany({});
});

describe('Authentication Flow Tests', () => {
    describe('Registration Flow', () => {
        const validUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@test.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            terms: true
        };

        test('should successfully register a new user', async () => {
            const response = await request(app)
                .post('/users/register')
                .send(validUser)
                .expect(302); // Expect redirect

            // Should redirect to login page
            expect(response.headers.location).toBe('/users/login');

            // Verify user was created in database
            const user = await User.findOne({ email: validUser.email });
            expect(user).toBeTruthy();
            expect(user.firstName).toBe(validUser.firstName);
            expect(user.lastName).toBe(validUser.lastName);
            expect(user.email).toBe(validUser.email);
            // Password should be hashed
            const isMatch = await user.comparePassword(validUser.password);
            expect(isMatch).toBe(true);
        });

        test('should prevent registration with duplicate email', async () => {
            // First register a user
            await request(app)
                .post('/users/register')
                .send(validUser);

            // Try to register the same user again
            const response = await request(app)
                .post('/users/register')
                .send(validUser)
                .expect(302); // Expect redirect back to register page

            expect(response.headers.location).toBe('/users/register');
        });

        test('should validate password match', async () => {
            const userWithMismatchedPasswords = {
                ...validUser,
                confirmPassword: 'differentpassword'
            };

            const response = await request(app)
                .post('/users/register')
                .send(userWithMismatchedPasswords)
                .expect(302); // Expect redirect back to register page

            expect(response.headers.location).toBe('/users/register');
        });

        test('should validate password length', async () => {
            const userWithShortPassword = {
                ...validUser,
                password: 'short',
                confirmPassword: 'short'
            };

            const response = await request(app)
                .post('/users/register')
                .send(userWithShortPassword)
                .expect(302); // Expect redirect back to register page

            expect(response.headers.location).toBe('/users/register');
        });

        test('should require terms acceptance', async () => {
            const userWithoutTerms = {
                ...validUser,
                terms: false
            };

            const response = await request(app)
                .post('/users/register')
                .send(userWithoutTerms)
                .expect(302); // Expect redirect back to register page

            expect(response.headers.location).toBe('/users/register');
        });
    });

    describe('Login Flow', () => {
        const testUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@test.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            terms: true
        };

        beforeEach(async () => {
            // Create a test user before each login test
            const user = new User({
                firstName: testUser.firstName,
                lastName: testUser.lastName,
                email: testUser.email,
                password: testUser.password
            });
            await user.save();
        });

        test('should successfully login with valid credentials', async () => {
            const response = await request(app)
                .post('/users/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(302); // Expect redirect

            // Should redirect to dashboard
            expect(response.headers.location).toBe('/dashboard');
            
            // Should set session cookie
            expect(response.headers['set-cookie']).toBeDefined();
        });

        test('should fail login with incorrect password', async () => {
            const response = await request(app)
                .post('/users/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                })
                .expect(302); // Expect redirect back to login

            expect(response.headers.location).toBe('/users/login');
        });

        test('should fail login with non-existent email', async () => {
            const response = await request(app)
                .post('/users/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: testUser.password
                })
                .expect(302); // Expect redirect back to login

            expect(response.headers.location).toBe('/users/login');
        });

        test('should protect dashboard route when not logged in', async () => {
            const response = await request(app)
                .get('/dashboard')
                .expect(302); // Expect redirect to login

            expect(response.headers.location).toContain('/users/login');
        });

        test('should access dashboard route when logged in', async () => {
            const agent = request.agent(app);

            // Login first
            await agent
                .post('/users/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            // Try accessing dashboard
            const response = await agent
                .get('/dashboard')
                .expect(200); // Dashboard renders directly

            expect(response.text).toContain('Welcome');
        });

        test('should set proper session cookie on login', async () => {
            const response = await request(app)
                .post('/users/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            
            // The cookie should be named 'connect.sid' (default Express session cookie name)
            const sessionCookie = cookies.find(cookie => cookie.startsWith('connect.sid'));
            expect(sessionCookie).toBeDefined();
            
            // Cookie should be HTTP-only for security
            expect(sessionCookie).toContain('HttpOnly');
            
            // Should not be accessible via JavaScript
            expect(sessionCookie).not.toContain('javascript:');
        });
    });
}); 