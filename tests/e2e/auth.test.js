const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app'); // Adjust path as needed
const User = require('../../models/User');

let mongoServer;

describe('Authentication Flow Tests', () => {
    beforeAll(async () => {
        // Create an in-memory MongoDB instance
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear the users collection before each test
        await User.deleteMany({});
    });

    describe('Registration Flow', () => {
        const validUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@test.com',
            password: 'password123',
            confirmPassword: 'password123',
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
            expect(user.password).not.toBe(validUser.password);
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
                .expect(200); // Expect to stay on registration page

            expect(response.text).toContain('Email is already registered');
        });

        test('should validate password match', async () => {
            const userWithMismatchedPasswords = {
                ...validUser,
                confirmPassword: 'differentpassword'
            };

            const response = await request(app)
                .post('/users/register')
                .send(userWithMismatchedPasswords)
                .expect(200); // Expect to stay on registration page

            expect(response.text).toContain('Passwords do not match');
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
                .expect(200); // Expect to stay on registration page

            expect(response.text).toContain('Password must be at least 8 characters long');
        });

        test('should require terms acceptance', async () => {
            const userWithoutTerms = {
                ...validUser,
                terms: false
            };

            const response = await request(app)
                .post('/users/register')
                .send(userWithoutTerms)
                .expect(200); // Expect to stay on registration page

            expect(response.text).toContain('You must accept the Terms of Service and Privacy Policy');
        });
    });

    describe('Login Flow', () => {
        const testUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@test.com',
            password: 'password123',
            confirmPassword: 'password123',
            terms: true
        };

        beforeEach(async () => {
            // Create a test user before each login test
            await request(app)
                .post('/users/register')
                .send(testUser);
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
                .expect(200); // Expect successful access

            expect(response.text).toContain('Dashboard');
        });
    });
}); 