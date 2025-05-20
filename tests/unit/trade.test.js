const mongoose = require('mongoose');
const Trade = require('../../models/Trade');
const User = require('../../models/User');
const Item = require('../../models/Item');

describe('Trade Model Test', () => {
    let initiator, receiver, offeredItem, requestedItem;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trade_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

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
        // Clean up test data
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Trade.deleteMany({});
    });

    it('should create a trade successfully', async () => {
        const tradeData = {
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            messages: [{
                sender: initiator._id,
                content: 'Test message'
            }]
        };

        const trade = await Trade.create(tradeData);
        expect(trade).toBeDefined();
        expect(trade.status).toBe('Pending');
        expect(trade.initiator.toString()).toBe(initiator._id.toString());
        expect(trade.receiver.toString()).toBe(receiver._id.toString());
    });

    it('should add a message to trade', async () => {
        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id]
        });

        await trade.addMessage(receiver._id, 'New test message');
        const updatedTrade = await Trade.findById(trade._id);
        
        expect(updatedTrade.messages).toHaveLength(1);
        expect(updatedTrade.messages[0].content).toBe('New test message');
        expect(updatedTrade.messages[0].sender.toString()).toBe(receiver._id.toString());
    });

    it('should update trade status', async () => {
        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id]
        });

        await trade.updateStatus('Accepted');
        const updatedTrade = await Trade.findById(trade._id);
        
        expect(updatedTrade.status).toBe('Accepted');
    });

    it('should validate required fields', async () => {
        const tradeData = {
            initiator: initiator._id,
            // Missing receiver
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id]
        };

        try {
            await Trade.create(tradeData);
            fail('Should have thrown an error');
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('should validate status enum values', async () => {
        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id]
        });

        try {
            await trade.updateStatus('InvalidStatus');
            fail('Should have thrown an error');
        } catch (error) {
            expect(error).toBeDefined();
        }
    });
}); 