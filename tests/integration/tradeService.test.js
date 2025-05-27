const mongoose = require('mongoose');
const tradeService = require('../../services/tradeService');
const User = require('../../models/User');
const Item = require('../../models/Item');
const Trade = require('../../models/Trade');

describe('Trade Service Integration Test', () => {
    let initiator, receiver, offeredItem, requestedItem;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-system-test');
    });

    beforeEach(async () => {
        await Trade.deleteMany({});
        await User.deleteMany({});
        await Item.deleteMany({});

        // Create test users
        initiator = await User.create({
            firstName: 'Test',
            lastName: 'Initiator',
            email: 'initiator@test.com',
            password: 'password123'
        });

        receiver = await User.create({
            firstName: 'Test',
            lastName: 'Receiver',
            email: 'receiver@test.com',
            password: 'password123'
        });

        // Create test items
        offeredItem = await Item.create({
            title: 'Test Offered Item',
            description: 'Test Description',
            owner: initiator._id,
            images: ['test-image.jpg'],
            status: 'Available',
            location: 'Test Location',
            condition: 'Like New',
            category: 'Electronics',
            value: 100
        });

        requestedItem = await Item.create({
            title: 'Test Requested Item',
            description: 'Test Description',
            owner: receiver._id,
            images: ['test-image.jpg'],
            status: 'Available',
            location: 'Test Location',
            condition: 'Good',
            category: 'Books',
            value: 100
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('createTradeService', () => {
        it('should create a trade successfully', async () => {
            const tradeData = {
                initiator: initiator._id,
                receiverId: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                message: 'Test trade proposal'
            };

            const trade = await tradeService.createTradeService(tradeData);

            expect(trade).toBeDefined();
            expect(trade.status).toBe('Pending');
            expect(trade.initiator.toString()).toBe(initiator._id.toString());
            expect(trade.receiver.toString()).toBe(receiver._id.toString());
            expect(trade.messages).toHaveLength(1);
        });
    });

    describe('updateTradeStatusService', () => {
        it('should update trade status and item statuses', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Pending'
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
                requestedItems: [requestedItem._id],
                status: 'Pending'
            });

            const updatedTrade = await tradeService.addMessageService(
                trade._id,
                receiver._id,
                'New test message'
            );

            expect(updatedTrade.messages).toHaveLength(1);
            expect(updatedTrade.messages[0].content).toBe('New test message');
            expect(updatedTrade.messages[0].sender.toString()).toBe(receiver._id.toString());
        });
    });
}); 