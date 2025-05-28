const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Item = require('../../models/Item');

// Set default test database URI if not provided
const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trade_system_test';

describe('User Integration Tests', () => {
    let testUser;
    let authToken;

    beforeAll(async () => {
        await mongoose.connect(TEST_DB_URI);
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await Item.deleteMany({});
        
        // Create a test user
        testUser = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#',
            isVerified: true
        });
    });

    describe('Authentication', () => {
        it('should login an existing user', async () => {
            const res = await request(app)
                .post('/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123!@#'
                });

            expect(res.status).toBe(302); // Redirect after successful login
            expect(res.header.location).toBe('/dashboard');
        });

        it('should not login with invalid credentials', async () => {
            const res = await request(app)
                .post('/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(302);
            expect(res.header.location).toBe('/users/login');
        });
    });

    describe('Profile Management', () => {
        beforeEach(async () => {
            // Login and get session
            const loginRes = await request(app)
                .post('/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123!@#'
                });
            
            authToken = loginRes.headers['set-cookie'];
        });

        it('should get user profile', async () => {
            const res = await request(app)
                .get('/users/profile')
                .set('Cookie', authToken);

            expect(res.status).toBe(200);
            // Use regex to match name or check for email
            expect(res.text).toMatch(/Test\s*User/);
            expect(res.text).toContain('test@example.com');
        });

        it('should update user profile', async () => {
            const res = await request(app)
                .post('/users/profile')
                .set('Cookie', authToken)
                .send({
                    firstName: 'Updated',
                    lastName: 'Name',
                    phone: '1234567890',
                    location: 'Test Location'
                });

            expect(res.status).toBe(302);
            expect(res.header.location).toBe('/users/profile');

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.firstName).toBe('Updated');
            expect(updatedUser.lastName).toBe('Name');
            expect(updatedUser.phone).toBe('1234567890');
            expect(updatedUser.location).toBe('Test Location');
        });
    });
}); 