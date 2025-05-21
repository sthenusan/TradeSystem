const mongoose = require('mongoose');
const tradeService = require('../../services/tradeService');
const User = require('../../models/User');
const Item = require('../../models/Item');
const Trade = require('../../models/Trade');

describe('Trade Service Unit Test', () => {
    let initiator, receiver, offeredItem, requestedItem;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trade_test');

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
            description: 'Test Description2',
            owner: initiator._id,
            images: ['test-image.jpg'],
            status: 'Available'
        });

        requestedItem = await Item.create({
            title: 'Test Requested Item',
            description: 'Test Description',
            owner: receiver._id,
            images: ['test-image.jpg'],
            status: 'Available'
        });
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Trade.deleteMany({});
        await Item.updateMany({}, { status: 'Available' });
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
                .toThrow('Invalid items selected');
        });

        it('should throw error for unavailable items', async () => {
            await Item.findByIdAndUpdate(offeredItem._id, { status: 'Traded' });

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
            expect(updatedTrade.updatedAt).toBeDefined();
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
                name: 'Third User',
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
                requestedItems: [requestedItem._id],
                messages: [{
                    sender: initiator._id,
                    content: 'Test message'
                }]
            });

            const tradeDetails = await tradeService.getTradeService(trade._id);

            expect(tradeDetails).toBeDefined();
            expect(tradeDetails.initiator.name).toBe('Test Initiator');
            expect(tradeDetails.receiver.name).toBe('Test Receiver');
            expect(tradeDetails.offeredItems[0].title).toBe('Test Offered Item');
            expect(tradeDetails.requestedItems[0].title).toBe('Test Requested Item');
            expect(tradeDetails.messages[0].content).toBe('Test message');
        });

        it('should throw error for non-existent trade', async () => {
            await expect(tradeService.getTradeService(new mongoose.Types.ObjectId()))
                .rejects
                .toThrow('Trade not found');
        });
    });
}); 