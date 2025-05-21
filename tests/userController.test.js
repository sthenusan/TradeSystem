const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const userController = require('../controllers/userController');

// Mock request and response objects
const mockRequest = () => {
    return {
        user: { id: new mongoose.Types.ObjectId() },
        body: {},
        flash: jest.fn(),
        redirect: jest.fn()
    };
};

const mockResponse = () => {
    return {
        render: jest.fn(),
        redirect: jest.fn(),
        json: jest.fn()
    };
};

describe('User Controller Tests', () => {
    let testUser;
    const testPassword = 'TestPass@123';
    const newPassword = 'NewPass@123';

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trade_system_test');
    });

    afterAll(async () => {
        // Disconnect from test database
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear users collection
        await User.deleteMany({});

        // Create test user
        testUser = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: testPassword // plain text, let model hash it
        });
    });

    describe('updateProfile', () => {
        it('should successfully change password when all validations pass', async () => {
            const req = mockRequest();
            req.user.id = testUser._id;
            req.body = {
                firstName: testUser.firstName,
                lastName: testUser.lastName,
                email: testUser.email,
                currentPassword: testPassword,
                newPassword: newPassword,
                confirmNewPassword: newPassword
            };

            const res = mockResponse();

            const beforeUser = await User.findById(testUser._id);
            console.log('[TEST DEBUG] Before update, user.password:', beforeUser.password);

            await userController.updateProfile(req, res);

            // Verify the password was changed
            const updatedUser = await User.findById(testUser._id);
            console.log('[TEST DEBUG] After update, user.password:', updatedUser.password);
            const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
            expect(isMatch).toBe(true);
        });

        it('should fail when current password is incorrect', async () => {
            const req = mockRequest();
            req.user.id = testUser._id;
            req.body = {
                firstName: testUser.firstName,
                lastName: testUser.lastName,
                email: testUser.email,
                currentPassword: 'WrongPassword@123',
                newPassword: newPassword,
                confirmNewPassword: newPassword
            };

            const res = mockResponse();

            await userController.updateProfile(req, res);

            // Verify the password was not changed
            const updatedUser = await User.findById(testUser._id);
            const isMatch = await bcrypt.compare(testPassword, updatedUser.password);
            expect(isMatch).toBe(true);
        });

        it('should fail when new passwords do not match', async () => {
            const req = mockRequest();
            req.user.id = testUser._id;
            req.body = {
                firstName: testUser.firstName,
                lastName: testUser.lastName,
                email: testUser.email,
                currentPassword: testPassword,
                newPassword: newPassword,
                confirmNewPassword: 'DifferentPass@123'
            };

            const res = mockResponse();

            await userController.updateProfile(req, res);

            // Verify the password was not changed
            const updatedUser = await User.findById(testUser._id);
            const isMatch = await bcrypt.compare(testPassword, updatedUser.password);
            expect(isMatch).toBe(true);
        });

        it('should fail when new password does not meet complexity requirements', async () => {
            const req = mockRequest();
            req.user.id = testUser._id;
            req.body = {
                firstName: testUser.firstName,
                lastName: testUser.lastName,
                email: testUser.email,
                currentPassword: testPassword,
                newPassword: 'simplepass',
                confirmNewPassword: 'simplepass'
            };

            const res = mockResponse();

            await userController.updateProfile(req, res);

            // Verify the password was not changed
            const updatedUser = await User.findById(testUser._id);
            const isMatch = await bcrypt.compare(testPassword, updatedUser.password);
            expect(isMatch).toBe(true);
        });
    });
}); 