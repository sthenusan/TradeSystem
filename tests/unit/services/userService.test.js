const userService = require('../../../services/userService');
const User = require('../../../models/User');
const Item = require('../../../models/Item');
const mongoose = require('mongoose');

describe('User Service Test', () => {
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
        await Item.deleteMany({});
    });

    describe('createUser', () => {
        it('should create a new user successfully', async () => {
            const userData = {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123'
            };

            const user = await userService.createUser(userData);
            expect(user).toBeDefined();
            expect(user.firstName).toBe('Test');
            expect(user.lastName).toBe('User');
            expect(user.email).toBe('test@example.com');
            expect(user.password).not.toBe('password123'); // Password should be hashed
        });

        it('should throw error for duplicate email', async () => {
            const userData = {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123'
            };

            await userService.createUser(userData);

            await expect(userService.createUser(userData))
                .rejects.toThrow('Email already exists');
        });

        it('should throw error for invalid email format', async () => {
            const userData = {
                firstName: 'Test',
                lastName: 'User',
                email: 'invalid-email',
                password: 'password123'
            };

            await expect(userService.createUser(userData))
                .rejects.toThrow('Invalid email format');
        });
    });

    describe('updateUserProfile', () => {
        it('should update user profile successfully', async () => {
            const user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123'
            });

            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                location: 'New Location',
                bio: 'New bio'
            };

            const updatedUser = await userService.updateUserProfile(user._id, updateData);
            expect(updatedUser.firstName).toBe('Updated');
            expect(updatedUser.lastName).toBe('Name');
            expect(updatedUser.location).toBe('New Location');
            expect(updatedUser.bio).toBe('New bio');
        });

        it('should throw error for non-existent user', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name'
            };

            await expect(userService.updateUserProfile(new mongoose.Types.ObjectId(), updateData))
                .rejects.toThrow('User not found');
        });
    });

    describe('getUserItems', () => {
        it('should get user items successfully', async () => {
            const user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123'
            });

            // Create test items
            await Item.create([
                {
                    title: 'Item 1',
                    description: 'Description 1',
                    owner: user._id,
                    status: 'Available',
                    location: 'Test Location',
                    condition: 'Like New',
                    category: 'Electronics',
                    value: 100
                },
                {
                    title: 'Item 2',
                    description: 'Description 2',
                    owner: user._id,
                    status: 'Traded',
                    location: 'Test Location',
                    condition: 'Like New',
                    category: 'Electronics',
                    value: 200
                }
            ]);

            const items = await userService.getUserItems(user._id);
            expect(items).toHaveLength(2);
        });

        it('should get user items by status', async () => {
            const user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123'
            });

            // Create test items
            await Item.create([
                {
                    title: 'Item 1',
                    description: 'Description 1',
                    owner: user._id,
                    status: 'Available',
                    location: 'Test Location',
                    condition: 'Like New',
                    category: 'Electronics',
                    value: 100
                },
                {
                    title: 'Item 2',
                    description: 'Description 2',
                    owner: user._id,
                    status: 'Traded',
                    location: 'Test Location',
                    condition: 'Like New',
                    category: 'Electronics',
                    value: 200
                }
            ]);

            const availableItems = await userService.getUserItems(user._id, 'Available');
            expect(availableItems).toHaveLength(1);
            expect(availableItems[0].status).toBe('Available');

            const tradedItems = await userService.getUserItems(user._id, 'Traded');
            expect(tradedItems).toHaveLength(1);
            expect(tradedItems[0].status).toBe('Traded');
        });
    });

    describe('updateUserRating', () => {
        it('should update user rating successfully', async () => {
            const user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123'
            });

            const updatedUser = await userService.updateUserRating(user._id, 4.5);
            expect(updatedUser.averageRating).toBe(4.5);
        });

        it('should throw error for invalid rating', async () => {
            const user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123'
            });

            await expect(userService.updateUserRating(user._id, 6))
                .rejects.toThrow('Rating must be between 0 and 5');
        });
    });
}); 