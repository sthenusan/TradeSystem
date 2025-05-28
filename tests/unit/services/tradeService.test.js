const mongoose = require('mongoose');
const Trade = require('../../../models/Trade');
const User = require('../../../models/User');
const Item = require('../../../models/Item');
const tradeService = require('../../../services/tradeService');

describe('Trade Service Test', () => {
    let initiator, receiver, offeredItem, requestedItem;

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
        await Trade.deleteMany({});

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
            title: 'Offered Item',
            description: 'Test Description',
            owner: initiator._id,
            status: 'Available',
            location: 'Test Location',
            condition: 'Like New',
            category: 'Electronics',
            value: 100
        });

        requestedItem = await Item.create({
            title: 'Requested Item',
            description: 'Test Description',
            owner: receiver._id,
            status: 'Available',
            location: 'Test Location',
            condition: 'Like New',
            category: 'Electronics',
            value: 100
        });
    });

    describe('createTradeService', () => {
        it('should create a new trade successfully', async () => {
            const tradeData = {
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                message: 'Test trade proposal'
            };

            const trade = await tradeService.createTradeService(tradeData);
            expect(trade).toBeDefined();
            expect(trade.initiator.toString()).toBe(initiator._id.toString());
            expect(trade.receiver.toString()).toBe(receiver._id.toString());
            expect(trade.status).toBe('Pending');
            expect(trade.messages).toHaveLength(1);
            expect(trade.messages[0].content).toBe('Test trade proposal');
        });

        it('should throw error for invalid receiver', async () => {
            const tradeData = {
                initiator: initiator._id,
                receiver: new mongoose.Types.ObjectId(),
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                message: 'Test trade proposal'
            };

            await expect(tradeService.createTradeService(tradeData))
                .rejects.toThrow('Invalid receiver');
        });

        it('should throw error for unavailable items', async () => {
            // Make item unavailable
            await Item.findByIdAndUpdate(offeredItem._id, { status: 'Traded' });

            const tradeData = {
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                message: 'Test trade proposal'
            };

            await expect(tradeService.createTradeService(tradeData))
                .rejects.toThrow('Items are not available for trade');
        });
    });

    describe('getTradeService', () => {
        it('should get trade by id', async () => {
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

            const foundTrade = await tradeService.getTradeService(trade._id);
            expect(foundTrade).toBeDefined();
            expect(foundTrade._id.toString()).toBe(trade._id.toString());
            expect(foundTrade.initiator.firstName).toBe('Test');
            expect(foundTrade.receiver.firstName).toBe('Test');
        });

        it('should throw error for non-existent trade', async () => {
            await expect(tradeService.getTradeService(new mongoose.Types.ObjectId()))
                .rejects.toThrow('Trade not found');
        });
    });

    describe('updateTradeStatusService', () => {
        it('should update trade status and item statuses', async () => {
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

            const updatedTrade = await tradeService.updateTradeStatusService(
                trade._id,
                receiver._id,
                'Completed'
            );

            expect(updatedTrade.status).toBe('Completed');

            // Verify items were updated
            const updatedOfferedItem = await Item.findById(offeredItem._id);
            const updatedRequestedItem = await Item.findById(requestedItem._id);
            expect(updatedOfferedItem.status).toBe('Traded');
            expect(updatedRequestedItem.status).toBe('Traded');
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
                'Completed'
            )).rejects.toThrow('Unauthorized to update trade status');
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
                'New message'
            );

            expect(updatedTrade.messages).toHaveLength(1);
            expect(updatedTrade.messages[0].content).toBe('New message');
            expect(updatedTrade.messages[0].sender.toString()).toBe(receiver._id.toString());
        });

        it('should throw error for unauthorized message', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const unauthorizedUser = await User.create({
                firstName: 'Unauthorized',
                lastName: 'User',
                email: 'unauthorized@test.com',
                password: 'password123'
            });

            await expect(tradeService.addMessageService(
                trade._id,
                unauthorizedUser._id,
                'New message'
            )).rejects.toThrow('Unauthorized to add message');
        });
    });
}); 