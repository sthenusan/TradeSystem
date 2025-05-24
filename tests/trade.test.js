const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Trade = require('../models/Trade');
const User = require('../models/User');
const Item = require('../models/Item');
const { notifyTradeProposal, notifyTradeStatusUpdate, notifyNewMessage } = require('../services/notificationService');

// Mock the notification service
jest.mock('../services/notificationService', () => ({
    notifyTradeProposal: jest.fn(),
    notifyTradeStatusUpdate: jest.fn(),
    notifyNewMessage: jest.fn()
}));

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Trade.deleteMany({});
    await User.deleteMany({});
    await Item.deleteMany({});
    jest.clearAllMocks();
});

describe('Trade Operations', () => {
    let initiator, receiver, offeredItem, requestedItem;

    beforeAll(async () => {
        // Create test users
        initiator = await User.create({
            name: 'Test Initiator',
            email: 'initiator@test.com',
            password: 'password123'
        });

        receiver = await User.create({
            name: 'Test Receiver',
            email: 'receiver@test.com',
            password: 'password123'
        });

        // Create test items
        offeredItem = await Item.create({
            title: 'Test Offered Item',
            description: 'Test Description',
            owner: initiator._id,
            images: ['test-image.jpg']
        });

        requestedItem = await Item.create({
            title: 'Test Requested Item',
            description: 'Test Description',
            owner: receiver._id,
            images: ['test-image.jpg']
        });
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});
    });

    beforeEach(async () => {
        await Trade.deleteMany({});
    });

    test('should create a new trade proposal', async () => {
        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            status: 'Pending',
            messages: [{
                sender: initiator._id,
                content: 'Trade proposal'
            }]
        });

        expect(trade).toBeDefined();
        expect(trade.status).toBe('Pending');
        expect(trade.initiator.toString()).toBe(initiator._id.toString());
        expect(trade.receiver.toString()).toBe(receiver._id.toString());
        expect(notifyTradeProposal).toHaveBeenCalledWith(trade);
    });

    test('should update trade status to Accepted', async () => {
        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            status: 'Pending'
        });

        trade.status = 'Accepted';
        await trade.save();

        expect(trade.status).toBe('Accepted');
        expect(notifyTradeStatusUpdate).toHaveBeenCalledWith(trade, 'Accepted');
    });

    test('should complete trade and update item statuses', async () => {
        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            status: 'Accepted'
        });

        trade.status = 'Completed';
        await trade.save();

        // Update item statuses
        await Item.updateMany(
            { _id: { $in: [...trade.offeredItems, ...trade.requestedItems] } },
            { status: 'Traded' }
        );

        const updatedItems = await Item.find({
            _id: { $in: [...trade.offeredItems, ...trade.requestedItems] }
        });

        expect(trade.status).toBe('Completed');
        expect(updatedItems.every(item => item.status === 'Traded')).toBe(true);
        expect(notifyTradeStatusUpdate).toHaveBeenCalledWith(trade, 'Completed');
    });

    test('should add rating to completed trade', async () => {
        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            status: 'Completed'
        });

        // Add initiator's rating
        trade.initiatorRating = {
            rating: 5,
            comment: 'Great trade!',
            timestamp: new Date()
        };
        await trade.save();

        // Add receiver's rating
        trade.receiverRating = {
            rating: 4,
            comment: 'Good experience',
            timestamp: new Date()
        };
        await trade.save();

        const updatedTrade = await Trade.findById(trade._id);
        expect(updatedTrade.initiatorRating.rating).toBe(5);
        expect(updatedTrade.receiverRating.rating).toBe(4);
    });

    test('should update user average rating after trade rating', async () => {
        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            status: 'Completed'
        });

        // Add ratings
        trade.initiatorRating = {
            rating: 5,
            comment: 'Great trade!',
            timestamp: new Date()
        };
        await trade.save();

        trade.receiverRating = {
            rating: 4,
            comment: 'Good experience',
            timestamp: new Date()
        };
        await trade.save();

        // Update receiver's average rating
        const receiverTrades = await Trade.find({
            $or: [
                { initiator: receiver._id, 'initiatorRating.rating': { $exists: true } },
                { receiver: receiver._id, 'receiverRating.rating': { $exists: true } }
            ]
        });

        let totalRating = 0;
        let ratingCount = 0;

        receiverTrades.forEach(t => {
            if (t.initiator.toString() === receiver._id.toString() && t.initiatorRating.rating) {
                totalRating += t.initiatorRating.rating;
                ratingCount++;
            }
            if (t.receiver.toString() === receiver._id.toString() && t.receiverRating.rating) {
                totalRating += t.receiverRating.rating;
                ratingCount++;
            }
        });

        receiver.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
        await receiver.save();

        const updatedReceiver = await User.findById(receiver._id);
        expect(updatedReceiver.averageRating).toBe(4);
    });

    test('should add message to trade and notify other party', async () => {
        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            status: 'Pending'
        });

        const message = 'Hello, I would like to trade!';
        await trade.addMessage(initiator._id, message);

        const updatedTrade = await Trade.findById(trade._id);
        expect(updatedTrade.messages).toHaveLength(1);
        expect(updatedTrade.messages[0].content).toBe(message);
        expect(notifyNewMessage).toHaveBeenCalledWith(trade, initiator, message);
    });
}); 