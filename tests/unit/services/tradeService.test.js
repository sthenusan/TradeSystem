const mongoose = require('mongoose');
const Trade = require('../../../models/Trade');
const User = require('../../../models/User');
const Item = require('../../../models/Item');
const tradeService = require('../../../services/tradeService');

describe('Trade Service Test', () => {
    beforeAll(async () => {
        // Connect to test database only if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trade_test');
        }
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});
        // Close connection only if we opened it
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });

    beforeEach(async () => {
        // Clear all collections before each test
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});
    });

    it('should create a new trade', async () => {
        // Create test users
        const initiator = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const receiver = await User.create({
            firstName: 'Other',
            lastName: 'User',
            email: 'other@example.com',
            password: 'Test123!@#'
        });

        // Create test items
        const offeredItem = await Item.create({
            title: 'Test Item',
            description: 'Test Description',
            owner: initiator._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const requestedItem = await Item.create({
            title: 'Other Item',
            description: 'Other Description',
            owner: receiver._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const tradeData = {
            initiator: initiator._id,
            receiverId: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            message: 'Initial trade proposal'
        };

        const trade = await tradeService.createTradeService(tradeData);
        expect(trade).toHaveProperty('_id');
        expect(trade.initiator.toString()).toBe(initiator._id.toString());
        expect(trade.receiver.toString()).toBe(receiver._id.toString());
        expect(trade.messages).toHaveLength(1);
        expect(trade.messages[0].content).toBe('Initial trade proposal');

        // Verify items status was updated
        const updatedOfferedItem = await Item.findById(offeredItem._id);
        const updatedRequestedItem = await Item.findById(requestedItem._id);
        expect(updatedOfferedItem.status).toBe('Pending');
        expect(updatedRequestedItem.status).toBe('Pending');
    });

    it('should get trade by id', async () => {
        // Create test users
        const initiator = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const receiver = await User.create({
            firstName: 'Other',
            lastName: 'User',
            email: 'other@example.com',
            password: 'Test123!@#'
        });

        // Create test items
        const offeredItem = await Item.create({
            title: 'Test Item',
            description: 'Test Description',
            owner: initiator._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const requestedItem = await Item.create({
            title: 'Other Item',
            description: 'Other Description',
            owner: receiver._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            messages: [{ sender: initiator._id, content: 'Initial message' }]
        });

        const foundTrade = await tradeService.getTradeService(trade._id);
        expect(foundTrade).toBeDefined();
        expect(foundTrade._id.toString()).toBe(trade._id.toString());
        expect(foundTrade.initiator.firstName).toBe('Test');
        expect(foundTrade.receiver.firstName).toBe('Other');
    });

    it('should update trade status', async () => {
        // Create test users
        const initiator = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const receiver = await User.create({
            firstName: 'Other',
            lastName: 'User',
            email: 'other@example.com',
            password: 'Test123!@#'
        });

        // Create test items
        const offeredItem = await Item.create({
            title: 'Test Item',
            description: 'Test Description',
            owner: initiator._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const requestedItem = await Item.create({
            title: 'Other Item',
            description: 'Other Description',
            owner: receiver._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            messages: [{ sender: initiator._id, content: 'Initial message' }]
        });

        const updatedTrade = await tradeService.updateTradeStatusService(trade._id, receiver._id, 'Accepted');
        expect(updatedTrade.status).toBe('Accepted');

        // Verify items status was updated
        const updatedOfferedItem = await Item.findById(offeredItem._id);
        const updatedRequestedItem = await Item.findById(requestedItem._id);
        expect(updatedOfferedItem.status).toBe('Traded');
        expect(updatedRequestedItem.status).toBe('Traded');
    });

    it('should add message to trade', async () => {
        // Create test users
        const initiator = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const receiver = await User.create({
            firstName: 'Other',
            lastName: 'User',
            email: 'other@example.com',
            password: 'Test123!@#'
        });

        // Create test items
        const offeredItem = await Item.create({
            title: 'Test Item',
            description: 'Test Description',
            owner: initiator._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const requestedItem = await Item.create({
            title: 'Other Item',
            description: 'Other Description',
            owner: receiver._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            messages: [{ sender: initiator._id, content: 'Initial message' }]
        });

        const updatedTrade = await tradeService.addMessageService(trade._id, receiver._id, 'New message');
        expect(updatedTrade.messages).toHaveLength(2);
        expect(updatedTrade.messages[1].content).toBe('New message');
        expect(updatedTrade.messages[1].sender.toString()).toBe(receiver._id.toString());
    });

    it('should throw error for invalid receiver', async () => {
        // Create test user
        const initiator = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        // Create test items
        const offeredItem = await Item.create({
            title: 'Test Item',
            description: 'Test Description',
            owner: initiator._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const tradeData = {
            initiator: initiator._id,
            receiverId: new mongoose.Types.ObjectId(), // Non-existent user
            offeredItems: [offeredItem._id],
            requestedItems: [],
            message: 'Initial trade proposal'
        };

        await expect(tradeService.createTradeService(tradeData)).rejects.toThrow('Invalid receiver');
    });

    it('should throw error for unavailable items', async () => {
        // Create test users
        const initiator = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const receiver = await User.create({
            firstName: 'Other',
            lastName: 'User',
            email: 'other@example.com',
            password: 'Test123!@#'
        });

        // Create test items
        const offeredItem = await Item.create({
            title: 'Test Item',
            description: 'Test Description',
            owner: initiator._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Traded', // Item not available
            location: 'Test Location'
        });

        const tradeData = {
            initiator: initiator._id,
            receiverId: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [],
            message: 'Initial trade proposal'
        };

        await expect(tradeService.createTradeService(tradeData)).rejects.toThrow('Items are not available for trade');
    });
}); 