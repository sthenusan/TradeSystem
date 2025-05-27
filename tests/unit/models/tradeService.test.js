const mongoose = require('mongoose');
const tradeService = require('../../../services/tradeService');
const User = require('../../../models/User');
const Item = require('../../../models/Item');
const Trade = require('../../../models/Trade');

describe('Trade Service Unit Test', () => {
    let initiator, receiver, offeredItem, requestedItem;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trade_test');
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clean up before each test
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});

        // Create test users with robust unique emails
        const unique = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        initiator = await User.create({
            firstName: 'Test',
            lastName: 'Initiator',
            email: `initiator${unique}@test.com`,
            password: 'password123'
        });
        receiver = await User.create({
            firstName: 'Test',
            lastName: 'Receiver',
            email: `receiver${unique}@test.com`,
            password: 'password123'
        });
        // eslint-disable-next-line no-console
        console.log('[DEBUG] initiator:', initiator ? initiator._id : null);
        console.log('[DEBUG] receiver:', receiver ? receiver._id : null);
        // Create test items
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
        // eslint-disable-next-line no-console
        console.log('[DEBUG] offeredItem:', offeredItem ? offeredItem._id : null);
        console.log('[DEBUG] requestedItem:', requestedItem ? requestedItem._id : null);
    });

    describe('createTradeService', () => {
        it('should create a trade with valid data', async () => {
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

        it('should throw error for invalid receiver', async () => {
            const tradeData = {
                initiator: initiator._id,
                receiverId: new mongoose.Types.ObjectId(),
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                message: 'Test trade proposal'
            };

            await expect(tradeService.createTradeService(tradeData))
                .rejects
                .toThrow('Invalid receiver');
        });

        it('should throw error for invalid items', async () => {
            const tradeData = {
                initiator: initiator._id,
                receiverId: receiver._id,
                offeredItems: [new mongoose.Types.ObjectId()],
                requestedItems: [requestedItem._id],
                message: 'Test trade proposal'
            };

            await expect(tradeService.createTradeService(tradeData))
                .rejects
                .toThrow('Items are not available for trade');
        });

        it('should throw error for unavailable items', async () => {
            // Make items unavailable
            await Item.updateMany({}, { status: 'Traded' });

            const tradeData = {
                initiator: initiator._id,
                receiverId: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                message: 'Test trade proposal'
            };

            await expect(tradeService.createTradeService(tradeData))
                .rejects
                .toThrow('Items are not available for trade');
        });
    });

    describe('updateTradeStatusService', () => {
        it('should update trade status to Accepted', async () => {
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

            // Refresh items from database
            const updatedOfferedItem = await Item.findById(offeredItem._id);
            const updatedRequestedItem = await Item.findById(requestedItem._id);
            
            expect(updatedOfferedItem).toBeDefined();
            expect(updatedRequestedItem).toBeDefined();
            expect(updatedOfferedItem.status).toBe('Traded');
            expect(updatedRequestedItem.status).toBe('Traded');
        });

        it('should update trade status to Rejected', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const updatedTrade = await tradeService.updateTradeStatusService(
                trade._id,
                receiver._id,
                'Rejected'
            );

            expect(updatedTrade.status).toBe('Rejected');

            // Refresh items from database
            const updatedOfferedItem = await Item.findById(offeredItem._id);
            const updatedRequestedItem = await Item.findById(requestedItem._id);
            
            expect(updatedOfferedItem).toBeDefined();
            expect(updatedRequestedItem).toBeDefined();
            expect(updatedOfferedItem.status).toBe('Available');
            expect(updatedRequestedItem.status).toBe('Available');
        });

        it('should throw error for invalid status', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            await expect(tradeService.updateTradeStatusService(
                trade._id,
                receiver._id,
                'InvalidStatus'
            )).rejects.toThrow('Invalid status');
        });

        it('should throw error for unauthorized status update', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            await expect(tradeService.updateTradeStatusService(
                trade._id,
                initiator._id,
                'Accepted'
            )).rejects.toThrow('Not authorized');
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
            expect(updatedTrade.messages[0].sender.toString()).toBe(receiver._id.toString());
        });

        it('should throw error for unauthorized message', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const thirdUser = await User.create({
                firstName: 'Third',
                lastName: 'User',
                email: 'third@test.com',
                password: 'password123'
            });

            await expect(tradeService.addMessageService(
                trade._id,
                thirdUser._id,
                'Test message'
            )).rejects.toThrow('Not authorized');
        });

        it('should throw error for empty message', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            await expect(tradeService.addMessageService(
                trade._id,
                receiver._id,
                ''
            )).rejects.toThrow('Message content is required');
        });
    });

    describe('getTradeService', () => {
        it('should get trade with populated fields', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const tradeDetails = await tradeService.getTradeService(trade._id);

            expect(tradeDetails).toBeDefined();
            expect(tradeDetails.initiator).toBeDefined();
            expect(tradeDetails.receiver).toBeDefined();
            expect(tradeDetails.initiator.firstName).toBe('Test');
            expect(tradeDetails.initiator.lastName).toBe('Initiator');
            expect(tradeDetails.receiver.firstName).toBe('Test');
            expect(tradeDetails.receiver.lastName).toBe('Receiver');
        });

        it('should throw error for non-existent trade', async () => {
            await expect(tradeService.getTradeService(new mongoose.Types.ObjectId()))
                .rejects
                .toThrow('Trade not found');
        });
    });
}); 