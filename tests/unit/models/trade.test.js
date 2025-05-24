const mongoose = require('mongoose');
const Trade = require('../../../models/Trade');
const User = require('../../../models/User');
const Item = require('../../../models/Item');

describe('Trade Model Test', () => {
    let initiator, receiver, offeredItem, requestedItem;

    beforeAll(async () => {
<<<<<<< HEAD:tests/unit/models/trade.test.js
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trade_test');
=======
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
>>>>>>> fix/trade-issues:tests/unit/trade.test.js
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});
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