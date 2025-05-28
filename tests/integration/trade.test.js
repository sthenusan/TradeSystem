const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Item = require('../../models/Item');
const Trade = require('../../models/Trade');

// Set default test database URI if not provided
const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/trade_system_test';

describe('Trade Integration Tests', () => {
    let initiator;
    let receiver;
    let initiatorItem;
    let receiverItem;
    let initiatorToken;
    let receiverToken;

    beforeAll(async () => {
        await mongoose.connect(TEST_DB_URI);
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await Item.deleteMany({});
        await Trade.deleteMany({});

        // Create test users
        initiator = await User.create({
            firstName: 'Initiator',
            lastName: 'User',
            email: 'initiator@example.com',
            password: 'Test123!@#',
            isVerified: true
        });

        receiver = await User.create({
            firstName: 'Receiver',
            lastName: 'User',
            email: 'receiver@example.com',
            password: 'Test123!@#',
            isVerified: true
        });

        // Create test items
        initiatorItem = await Item.create({
            title: 'Initiator Item',
            description: 'Test Description',
            category: 'Electronics',
            condition: 'Like New',
            owner: initiator._id,
            images: ['test-image.jpg'],
            location: 'Test Location'
        });

        receiverItem = await Item.create({
            title: 'Receiver Item',
            description: 'Test Description',
            category: 'Electronics',
            condition: 'Like New',
            owner: receiver._id,
            images: ['test-image.jpg'],
            location: 'Test Location'
        });

        // Login both users and get their tokens
        const initiatorLogin = await request(app)
            .post('/users/login')
            .send({
                email: 'initiator@example.com',
                password: 'Test123!@#'
            });
        initiatorToken = initiatorLogin.headers['set-cookie'];

        const receiverLogin = await request(app)
            .post('/users/login')
            .send({
                email: 'receiver@example.com',
                password: 'Test123!@#'
            });
        receiverToken = receiverLogin.headers['set-cookie'];
    });

    describe('Trade Creation', () => {
        it('should create a new trade', async () => {
            const res = await request(app)
                .post('/trades')
                .set('Cookie', initiatorToken)
                .send({
                    receiverId: receiver._id,
                    offeredItems: [initiatorItem._id],
                    requestedItems: [receiverItem._id],
                    message: 'Would you like to trade?'
                });

            expect(res.status).toBe(302);
            expect(res.header.location).toBe('/trades');

            const trade = await Trade.findOne({
                initiator: initiator._id,
                receiver: receiver._id
            });
            expect(trade).toBeTruthy();
            expect(trade.status).toBe('Pending');
            expect(trade.offeredItems[0].toString()).toBe(initiatorItem._id.toString());
            expect(trade.requestedItems[0].toString()).toBe(receiverItem._id.toString());
        });

        it('should not create trade with unavailable items', async () => {
            // Mark receiver's item as unavailable
            await Item.findByIdAndUpdate(receiverItem._id, { status: 'Unavailable' });

            const res = await request(app)
                .post('/trades')
                .set('Cookie', initiatorToken)
                .send({
                    receiverId: receiver._id,
                    offeredItems: [initiatorItem._id],
                    requestedItems: [receiverItem._id],
                    message: 'Would you like to trade?'
                });

            expect(res.status).toBe(400);
            // Check for error message in response body or flash message
            expect(res.body.error || res.body.message).toBeTruthy();
        });
    });

    describe('Trade Status Updates', () => {
        let trade;

        beforeEach(async () => {
            // Create a test trade
            trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [initiatorItem._id],
                requestedItems: [receiverItem._id],
                status: 'Pending',
                messages: [{
                    sender: initiator._id,
                    content: 'Would you like to trade?'
                }]
            });
        });

        it('should accept a trade', async () => {
            const res = await request(app)
                .put(`/trades/${trade._id}/accept`)
                .set('Cookie', receiverToken);

            expect(res.status).toBe(302);
            expect(res.header.location).toBe('/trades');

            const updatedTrade = await Trade.findById(trade._id);
            expect(updatedTrade.status).toBe('Accepted');
        });

        it('should reject a trade', async () => {
            const res = await request(app)
                .put(`/trades/${trade._id}/reject`)
                .set('Cookie', receiverToken);

            expect(res.status).toBe(302);
            expect(res.header.location).toBe('/trades');

            const updatedTrade = await Trade.findById(trade._id);
            expect(updatedTrade.status).toBe('Rejected');
        });

        it('should complete a trade', async () => {
            // First accept the trade
            await Trade.findByIdAndUpdate(trade._id, { status: 'Accepted' });

            const res = await request(app)
                .put(`/trades/${trade._id}/complete`)
                .set('Cookie', initiatorToken);

            expect(res.status).toBe(302);
            
            const updatedTrade = await Trade.findById(trade._id);
            expect(updatedTrade.status).toBe('Completed');

            // Check if items are marked as traded
            const updatedInitiatorItem = await Item.findById(initiatorItem._id);
            const updatedReceiverItem = await Item.findById(receiverItem._id);
            expect(updatedInitiatorItem.status).toBe('Traded');
            expect(updatedReceiverItem.status).toBe('Traded');
        });
    });

    describe('Trade Messages', () => {
        let trade;

        beforeEach(async () => {
            // Create a test trade
            trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [initiatorItem._id],
                requestedItems: [receiverItem._id],
                status: 'Pending',
                messages: [{
                    sender: initiator._id,
                    content: 'Would you like to trade?'
                }]
            });
        });

        it('should add a message to trade', async () => {
            const res = await request(app)
                .post(`/trades/${trade._id}/messages`)
                .set('Cookie', receiverToken)
                .send({ content: 'Yes, I would like to trade!' });

            expect(res.status).toBe(302);
            
            const updatedTrade = await Trade.findById(trade._id);
            expect(updatedTrade.messages).toHaveLength(2);
            expect(updatedTrade.messages[1].content).toBe('Yes, I would like to trade!');
            expect(updatedTrade.messages[1].sender.toString()).toBe(receiver._id.toString());
        });

        it('should not allow non-participants to add messages', async () => {
            const nonParticipant = await User.create({
                firstName: 'Non',
                lastName: 'Participant',
                email: 'nonparticipant@example.com',
                password: 'Test123!@#',
                isVerified: true
            });

            const nonParticipantLogin = await request(app)
                .post('/users/login')
                .send({
                    email: 'nonparticipant@example.com',
                    password: 'Test123!@#'
                });
            const nonParticipantToken = nonParticipantLogin.headers['set-cookie'];

            const res = await request(app)
                .post(`/trades/${trade._id}/messages`)
                .set('Cookie', nonParticipantToken)
                .send({ content: 'I want to join this trade!' });

            expect(res.status).toBe(403);
            
            const updatedTrade = await Trade.findById(trade._id);
            expect(updatedTrade.messages).toHaveLength(1);
        });
    });
}); 