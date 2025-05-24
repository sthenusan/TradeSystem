const mongoose = require('mongoose');
const tradeService = require('../../services/tradeService');
const User = require('../../models/User');
const Item = require('../../models/Item');
const Trade = require('../../models/Trade');

describe('Trade Service Integration Test', () => {
    let initiator, receiver, offeredItem, requestedItem;

    beforeAll(async () => {
<<<<<<< HEAD
        await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trade_test');
        
        // Clean up the database
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});
        
=======
>>>>>>> fix/trade-issues
        // Create test users and items
        initiator = await User.create({
            firstName: 'Test',
            lastName: 'Initiator',
            email: 'initiator.service@test.com',
            password: 'password123'
        });

        receiver = await User.create({
            firstName: 'Test',
            lastName: 'Receiver',
            email: 'receiver.service@test.com',
            password: 'password123'
        });

        offeredItem = await Item.create({
            title: 'Test Offered Item',
            description: 'Test Description',
            owner: initiator._id,
            images: ['test-image.jpg'],
            location: 'Test Location',
            condition: 'New',
            category: 'Electronics',
            status: 'Available'
        });

        requestedItem = await Item.create({
            title: 'Test Requested Item',
            description: 'Test Description',
            owner: receiver._id,
            images: ['test-image.jpg'],
            location: 'Test Location',
            condition: 'New',
            category: 'Electronics',
            status: 'Available'
        });
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});
    });

    beforeEach(async () => {
        await Trade.deleteMany({});
        await Item.updateMany({}, { status: 'Available' });
    });

    describe('createTradeService', () => {
        it('should create a trade successfully', async () => {
            const trade = await tradeService.createTradeService({
                initiator: initiator._id,
                receiverId: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                message: 'Test trade proposal'
            });
            
            expect(trade.status).toBe('Pending');
            expect(trade.messages).toHaveLength(1);
            
            const updatedOfferedItem = await Item.findById(offeredItem._id);
            const updatedRequestedItem = await Item.findById(requestedItem._id);
            expect(updatedOfferedItem.status).toBe('Pending');
            expect(updatedRequestedItem.status).toBe('Pending');
        });
    });

    describe('updateTradeStatusService', () => {
        it('should update trade status and item statuses', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const updatedTrade = await tradeService.updateTradeStatusService(
                trade._id,
                receiver._id,
                'Accepted'
            );

            expect(updatedTrade.status).toBe('Accepted');

            const updatedOfferedItem = await Item.findById(offeredItem._id);
            const updatedRequestedItem = await Item.findById(requestedItem._id);
            expect(updatedOfferedItem.status).toBe('Traded');
            expect(updatedRequestedItem.status).toBe('Traded');
        });
    });

    describe('addMessageService', () => {
        it('should add message to trade', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const updatedTrade = await tradeService.addMessageService(
                trade._id,
                receiver._id,
                'New test message'
            );

            expect(updatedTrade.messages).toHaveLength(1);
            expect(updatedTrade.messages[0].content).toBe('New test message');
        });
    });
}); 