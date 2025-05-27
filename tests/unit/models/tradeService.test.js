const mongoose = require('mongoose');
const tradeService = require('../../services/tradeService');
const User = require('../../models/User');
const Item = require('../../models/Item');
const Trade = require('../../models/Trade');

describe('Trade Service', () => {
    let initiator, receiver, offeredItem, requestedItem;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade_system_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

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
            name: 'Test Offered Item',
            description: 'Test Description',
            owner: initiator._id,
            status: 'Available'
        });

        requestedItem = await Item.create({
            name: 'Test Requested Item',
            description: 'Test Description',
            owner: receiver._id,
            status: 'Available'
        });
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});
        await mongoose.connection.close();
    });

    describe('createTrade', () => {
        it('should create a new trade successfully', async () => {
            const trade = await tradeService.createTrade(
                initiator._id,
                receiver._id,
                [offeredItem._id],
                [requestedItem._id],
                'Test trade proposal'
            );

            expect(trade).toBeDefined();
            expect(trade.initiator.toString()).toBe(initiator._id.toString());
            expect(trade.receiver.toString()).toBe(receiver._id.toString());
            expect(trade.status).toBe('Pending');
            expect(trade.messages).toHaveLength(1);
        });

        it('should throw error if items are not available', async () => {
            await Item.findByIdAndUpdate(offeredItem._id, { status: 'Traded' });

            await expect(tradeService.createTrade(
                initiator._id,
                receiver._id,
                [offeredItem._id],
                [requestedItem._id],
                'Test trade proposal'
            )).rejects.toThrow('One or more items are not available for trade');

            await Item.findByIdAndUpdate(offeredItem._id, { status: 'Available' });
        });
    });

    describe('updateTradeStatus', () => {
        let trade;

        beforeEach(async () => {
            trade = await tradeService.createTrade(
                initiator._id,
                receiver._id,
                [offeredItem._id],
                [requestedItem._id],
                'Test trade proposal'
            );
        });

        it('should update trade status to Accepted', async () => {
            const updatedTrade = await tradeService.updateTradeStatus(
                trade._id,
                'Accepted',
                receiver._id
            );

            expect(updatedTrade.status).toBe('Accepted');
        });

        it('should throw error if user is not authorized', async () => {
            await expect(tradeService.updateTradeStatus(
                trade._id,
                'Accepted',
                initiator._id
            )).rejects.toThrow('Not authorized to update trade status');
        });
    });

    describe('getUserTrades', () => {
        beforeEach(async () => {
            await Trade.deleteMany({});
            await tradeService.createTrade(
                initiator._id,
                receiver._id,
                [offeredItem._id],
                [requestedItem._id],
                'Test trade proposal'
            );
        });

        it('should return trades for initiator', async () => {
            const trades = await tradeService.getUserTrades(initiator._id);
            expect(trades).toHaveLength(1);
            expect(trades[0].initiator._id.toString()).toBe(initiator._id.toString());
        });

        it('should return trades for receiver', async () => {
            const trades = await tradeService.getUserTrades(receiver._id);
            expect(trades).toHaveLength(1);
            expect(trades[0].receiver._id.toString()).toBe(receiver._id.toString());
        });
    });

    describe('addTradeMessage', () => {
        let trade;

        beforeEach(async () => {
            trade = await tradeService.createTrade(
                initiator._id,
                receiver._id,
                [offeredItem._id],
                [requestedItem._id],
                'Test trade proposal'
            );
        });

        it('should add message to trade', async () => {
            const updatedTrade = await tradeService.addTradeMessage(
                trade._id,
                receiver._id,
                'Test message'
            );

            expect(updatedTrade.messages).toHaveLength(2);
            expect(updatedTrade.messages[1].content).toBe('Test message');
        });

        it('should throw error if user is not part of trade', async () => {
            const otherUser = await User.create({
                firstName: 'Other',
                lastName: 'User',
                email: 'other@test.com',
                password: 'password123'
            });

            await expect(tradeService.addTradeMessage(
                trade._id,
                otherUser._id,
                'Test message'
            )).rejects.toThrow('Not authorized to message in this trade');
        });
    });

    describe('completeTrade', () => {
        let trade;

        beforeEach(async () => {
            trade = await tradeService.createTrade(
                initiator._id,
                receiver._id,
                [offeredItem._id],
                [requestedItem._id],
                'Test trade proposal'
            );
            await tradeService.updateTradeStatus(trade._id, 'Accepted', receiver._id);
        });

        it('should complete trade successfully', async () => {
            const completedTrade = await tradeService.completeTrade(
                trade._id,
                receiver._id
            );

            expect(completedTrade.status).toBe('Completed');
            
            // Check if items are marked as traded
            const offeredItemAfter = await Item.findById(offeredItem._id);
            const requestedItemAfter = await Item.findById(requestedItem._id);
            expect(offeredItemAfter.status).toBe('Traded');
            expect(requestedItemAfter.status).toBe('Traded');
        });

        it('should throw error if trade is not in Accepted state', async () => {
            await tradeService.updateTradeStatus(trade._id, 'Pending', receiver._id);

            await expect(tradeService.completeTrade(
                trade._id,
                receiver._id
            )).rejects.toThrow('Trade must be in Accepted state to complete');
        });
    });
}); 