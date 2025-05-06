const mongoose = require('mongoose');
const User = require('../../../models/User');

describe('User Model Test', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barter-trading-test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    it('should create & save user successfully', async () => {
        const validUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
        const savedUser = await validUser.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.name).toBe(validUser.name);
        expect(savedUser.email).toBe(validUser.email);
        expect(savedUser.password).not.toBe(validUser.password); // Password should be hashed
    });

    it('should fail to save user without required fields', async () => {
        const userWithoutRequiredField = new User({ name: 'Test User' });
        let err;

        try {
            await userWithoutRequiredField.save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('should fail to save user with invalid email', async () => {
        const userWithInvalidEmail = new User({
            name: 'Test User',
            email: 'invalid-email',
            password: 'password123'
        });
        let err;

        try {
            await userWithInvalidEmail.save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('should fail to save user with short password', async () => {
        const userWithShortPassword = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: '123'
        });
        let err;

        try {
            await userWithShortPassword.save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('should update user successfully', async () => {
        const user = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
        await user.save();

        user.name = 'Updated Name';
        const updatedUser = await user.save();

        expect(updatedUser.name).toBe('Updated Name');
    });

    it('should delete user successfully', async () => {
        const user = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
        await user.save();

        await User.findByIdAndDelete(user._id);
        const deletedUser = await User.findById(user._id);

        expect(deletedUser).toBeNull();
    });
}); 