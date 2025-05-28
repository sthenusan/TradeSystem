const emailService = require('../../../services/emailService');
const User = require('../../../models/User');
const mongoose = require('mongoose');

describe('Email Service Test', () => {
    let testUser;

    beforeAll(async () => {
        // Disconnect any existing connections
        await mongoose.disconnect();
        
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade_system_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }, 10000);

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }, 10000);

    beforeEach(async () => {
        // Clean up all collections
        await User.deleteMany({});

        // Create test user
        testUser = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123'
        });
    });

    describe('sendVerificationEmail', () => {
        it('should generate verification code and update user', async () => {
            const result = await emailService.sendVerificationEmail(testUser);
            
            expect(result).toBeDefined();
            expect(result.verificationCode).toBeDefined();
            expect(result.verificationCodeExpires).toBeDefined();
            
            // Verify user was updated with verification code
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.verificationCode).toBe(result.verificationCode);
            expect(updatedUser.verificationCodeExpires).toBeDefined();
        });

        it('should throw error for invalid user', async () => {
            await expect(emailService.sendVerificationEmail(null))
                .rejects.toThrow('User is required');
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should generate reset token and update user', async () => {
            const result = await emailService.sendPasswordResetEmail(testUser);
            
            expect(result).toBeDefined();
            expect(result.resetPasswordToken).toBeDefined();
            expect(result.resetPasswordExpires).toBeDefined();
            
            // Verify user was updated with reset token
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.resetPasswordToken).toBe(result.resetPasswordToken);
            expect(updatedUser.resetPasswordExpires).toBeDefined();
        });

        it('should throw error for invalid user', async () => {
            await expect(emailService.sendPasswordResetEmail(null))
                .rejects.toThrow('User is required');
        });
    });
}); 
const User = require('../../../models/User');
const mongoose = require('mongoose');

describe('Email Service Test', () => {
    let testUser;

    beforeAll(async () => {
        // Disconnect any existing connections
        await mongoose.disconnect();
        
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade_system_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }, 10000);

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }, 10000);

    beforeEach(async () => {
        // Clean up all collections
        await User.deleteMany({});

        // Create test user
        testUser = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123'
        });
    });

    describe('sendVerificationEmail', () => {
        it('should generate verification code and update user', async () => {
            const result = await emailService.sendVerificationEmail(testUser);
            
            expect(result).toBeDefined();
            expect(result.verificationCode).toBeDefined();
            expect(result.verificationCodeExpires).toBeDefined();
            
            // Verify user was updated with verification code
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.verificationCode).toBe(result.verificationCode);
            expect(updatedUser.verificationCodeExpires).toBeDefined();
        });

        it('should throw error for invalid user', async () => {
            await expect(emailService.sendVerificationEmail(null))
                .rejects.toThrow('User is required');
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should generate reset token and update user', async () => {
            const result = await emailService.sendPasswordResetEmail(testUser);
            
            expect(result).toBeDefined();
            expect(result.resetPasswordToken).toBeDefined();
            expect(result.resetPasswordExpires).toBeDefined();
            
            // Verify user was updated with reset token
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.resetPasswordToken).toBe(result.resetPasswordToken);
            expect(updatedUser.resetPasswordExpires).toBeDefined();
        });

        it('should throw error for invalid user', async () => {
            await expect(emailService.sendPasswordResetEmail(null))
                .rejects.toThrow('User is required');
        });
    });
}); 
const User = require('../../../models/User');
const mongoose = require('mongoose');

describe('Email Service Test', () => {
    let testUser;

    beforeAll(async () => {
        // Disconnect any existing connections
        await mongoose.disconnect();
        
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade_system_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }, 10000);

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }, 10000);

    beforeEach(async () => {
        // Clean up all collections
        await User.deleteMany({});

        // Create test user
        testUser = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123'
        });
    });

    describe('sendVerificationEmail', () => {
        it('should generate verification code and update user', async () => {
            const result = await emailService.sendVerificationEmail(testUser);
            
            expect(result).toBeDefined();
            expect(result.verificationCode).toBeDefined();
            expect(result.verificationCodeExpires).toBeDefined();
            
            // Verify user was updated with verification code
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.verificationCode).toBe(result.verificationCode);
            expect(updatedUser.verificationCodeExpires).toBeDefined();
        });

        it('should throw error for invalid user', async () => {
            await expect(emailService.sendVerificationEmail(null))
                .rejects.toThrow('User is required');
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should generate reset token and update user', async () => {
            const result = await emailService.sendPasswordResetEmail(testUser);
            
            expect(result).toBeDefined();
            expect(result.resetPasswordToken).toBeDefined();
            expect(result.resetPasswordExpires).toBeDefined();
            
            // Verify user was updated with reset token
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.resetPasswordToken).toBe(result.resetPasswordToken);
            expect(updatedUser.resetPasswordExpires).toBeDefined();
        });

        it('should throw error for invalid user', async () => {
            await expect(emailService.sendPasswordResetEmail(null))
                .rejects.toThrow('User is required');
        });
    });
}); 