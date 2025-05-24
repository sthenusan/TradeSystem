const mongoose = require('mongoose');
const tradeController = require('../controllers/tradeController');
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

// Connect to test database
beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-system-test');
});

// Clean up database and mocks before each test
beforeEach(async () => {
    await Trade.deleteMany({});
    await User.deleteMany({});
    await Item.deleteMany({});
    jest.clearAllMocks();
});

// Close database connection after all tests
afterAll(async () => {
    await mongoose.connection.close();
});

describe('Trade Controller', () => {
    let initiator, receiver, offeredItem, requestedItem;
    let req, res;

    beforeEach(async () => {
        // Create test users
        initiator = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            password: 'Password123!'
        });

        receiver = await User.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@test.com',
            password: 'Password123!'
        });

        // Create test items
        offeredItem = await Item.create({
            title: 'Test Item 1',
            description: 'Test Description 1',
            owner: initiator._id,
            status: 'Available',
            location: 'Test Location',
            condition: 'Like New',
            category: 'Electronics',
            images: ['test-image-1.jpg'],
            value: 100
        });

        requestedItem = await Item.create({
            title: 'Test Item 2',
            description: 'Test Description 2',
            owner: receiver._id,
            status: 'Available',
            location: 'Test Location',
            condition: 'Good',
            category: 'Books',
            images: ['test-image-2.jpg'],
            value: 100
        });

        // Setup request and response objects
        req = {
            user: { id: initiator._id },
            body: {},
            params: {},
            flash: jest.fn()
        };

        res = {
            status: jest.fn().mockReturnThis(),
            render: jest.fn(),
            redirect: jest.fn()
        };
    });

    describe('createTrade', () => {
        it('should create a new trade', async () => {
            req.body = {
                receiverId: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                message: 'Trade proposal'
            };

            await tradeController.createTrade(req, res);

            const trade = await Trade.findOne({
                initiator: initiator._id,
                receiver: receiver._id
            });

            expect(trade).toBeDefined();
            expect(trade.status).toBe('Pending');
            expect(notifyTradeProposal).toHaveBeenCalledWith(trade);
            expect(req.flash).toHaveBeenCalledWith('success_msg', 'Trade proposal sent successfully');
            expect(res.redirect).toHaveBeenCalled();
        });

        it('should handle invalid receiver ID', async () => {
            req.body = {
                receiverId: new mongoose.Types.ObjectId(),
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                message: 'Trade proposal'
            };

            await tradeController.createTrade(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.render).toHaveBeenCalledWith('error', { message: 'Invalid receiver' });
        });

        it('should handle invalid items', async () => {
            req.body = {
                receiverId: receiver._id,
                offeredItems: [new mongoose.Types.ObjectId()],
                requestedItems: [requestedItem._id],
                message: 'Trade proposal'
            };

            await tradeController.createTrade(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.render).toHaveBeenCalledWith('error', { message: 'Invalid items selected' });
        });
    });

    describe('updateTradeStatus', () => {
        it('should update trade status to Accepted', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Pending'
            });

            req.params.id = trade._id;
            req.body.status = 'Accepted';
            req.user.id = receiver._id;

            await tradeController.updateTradeStatus(req, res);

            const updatedTrade = await Trade.findById(trade._id);
            expect(updatedTrade.status).toBe('Accepted');
            expect(notifyTradeStatusUpdate).toHaveBeenCalledWith(updatedTrade, 'Accepted');
            expect(req.flash).toHaveBeenCalledWith('success_msg', 'Trade accepted successfully');
        });

        it('should handle invalid status', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Pending'
            });

            req.params.id = trade._id;
            req.body.status = 'InvalidStatus';
            req.user.id = receiver._id;

            await tradeController.updateTradeStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.render).toHaveBeenCalledWith('error', { message: 'Invalid status' });
        });

        it('should handle unauthorized access', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Pending'
            });

            req.params.id = trade._id;
            req.body.status = 'Accepted';
            req.user.id = new mongoose.Types.ObjectId();

            await tradeController.updateTradeStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.render).toHaveBeenCalledWith('error', { message: 'Not authorized' });
        });
    });

    describe('completeTrade', () => {
        it('should complete trade and update item statuses', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Accepted'
            });

            req.params.id = trade._id;
            req.user.id = initiator._id;

            await tradeController.completeTrade(req, res);

            const updatedTrade = await Trade.findById(trade._id);
            const updatedItems = await Item.find({
                _id: { $in: [...trade.offeredItems, ...trade.requestedItems] }
            });

            expect(updatedTrade.status).toBe('Completed');
            expect(updatedItems.every(item => item.status === 'Traded')).toBe(true);
            expect(notifyTradeStatusUpdate).toHaveBeenCalledWith(updatedTrade, 'Completed');
            expect(req.flash).toHaveBeenCalledWith('success_msg', 'Trade completed successfully');
        });

        it('should handle non-accepted trade', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Pending'
            });

            req.params.id = trade._id;
            req.user.id = initiator._id;

            await tradeController.completeTrade(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.render).toHaveBeenCalledWith('error', { message: 'Trade must be accepted before completion' });
        });
    });

    describe('rateTradePartner', () => {
        it('should add rating to completed trade', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Completed'
            });

            req.params.id = trade._id;
            req.user.id = initiator._id;
            req.body = {
                rating: 5,
                comment: 'Great trade!'
            };

            await tradeController.rateTradePartner(req, res);

            const updatedTrade = await Trade.findById(trade._id);
            expect(updatedTrade.initiatorRating.rating).toBe(5);
            expect(updatedTrade.initiatorRating.comment).toBe('Great trade!');
            expect(req.flash).toHaveBeenCalledWith('success_msg', 'Rating submitted successfully');
        });

        it('should handle non-completed trade', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Accepted'
            });

            req.params.id = trade._id;
            req.user.id = initiator._id;
            req.body = {
                rating: 5,
                comment: 'Great trade!'
            };

            await tradeController.rateTradePartner(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.render).toHaveBeenCalledWith('error', { message: 'Trade must be completed before rating' });
        });
    });

    describe('addMessage', () => {
        it('should add message to trade', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Pending'
            });

            req.params.id = trade._id;
            req.user.id = initiator._id;
            req.body = {
                content: 'Hello, I would like to trade!'
            };

            await tradeController.addMessage(req, res);

            const updatedTrade = await Trade.findById(trade._id);
            expect(updatedTrade.messages).toHaveLength(1);
            expect(updatedTrade.messages[0].content).toBe(req.body.content);
            expect(notifyNewMessage).toHaveBeenCalledWith(updatedTrade, req.user, req.body.content);
        });

        it('should handle empty message', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Pending'
            });

            req.params.id = trade._id;
            req.user.id = initiator._id;
            req.body = {
                content: ''
            };

            await tradeController.addMessage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.render).toHaveBeenCalledWith('error', { message: 'Message content is required' });
        });
    });
}); 