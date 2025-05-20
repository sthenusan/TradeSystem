const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Item = require('../../models/Item');
const Trade = require('../../models/Trade');

describe('Trade Controller Integration Test', () => {
    let initiator, receiver, offeredItem, requestedItem;
    let initiatorToken, receiverToken;

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
            description: 'Test Description',
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

        // Get auth tokens
        const initiatorLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'initiator@test.com', password: 'password123' });
        initiatorToken = initiatorLogin.body.token;

        const receiverLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'receiver@test.com', password: 'password123' });
        receiverToken = receiverLogin.body.token;
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

    describe('POST /api/trades', () => {
        it('should create a new trade', async () => {
            const response = await request(app)
                .post('/api/trades')
                .set('Authorization', `Bearer ${initiatorToken}`)
                .send({
                    receiverId: receiver._id,
                    offeredItems: [offeredItem._id],
                    requestedItems: [requestedItem._id],
                    message: 'Test trade proposal'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('Pending');
            expect(response.body.messages).toHaveLength(1);
            expect(response.body.messages[0].content).toBe('Test trade proposal');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/trades')
                .send({
                    receiverId: receiver._id,
                    offeredItems: [offeredItem._id],
                    requestedItems: [requestedItem._id]
                });

            expect(response.status).toBe(401);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/trades')
                .set('Authorization', `Bearer ${initiatorToken}`)
                .send({
                    receiverId: receiver._id
                    // Missing required fields
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/trades', () => {
        it('should get all trades for authenticated user', async () => {
            // Create multiple trades
            await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            await Trade.create({
                initiator: receiver._id,
                receiver: initiator._id,
                offeredItems: [requestedItem._id],
                requestedItems: [offeredItem._id]
            });

            const response = await request(app)
                .get('/api/trades')
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/trades');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/trades/:id', () => {
        it('should get trade details', async () => {
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

            const response = await request(app)
                .get(`/api/trades/${trade._id}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(response.status).toBe(200);
            expect(response.body._id.toString()).toBe(trade._id.toString());
            expect(response.body.initiator.name).toBe('Test Initiator');
            expect(response.body.receiver.name).toBe('Test Receiver');
            expect(response.body.messages).toHaveLength(1);
        });

        it('should return 404 for non-existent trade', async () => {
            const response = await request(app)
                .get(`/api/trades/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/trades/:id/status', () => {
        it('should update trade status', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .put(`/api/trades/${trade._id}/status`)
                .set('Authorization', `Bearer ${receiverToken}`)
                .send({ status: 'Accepted' });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('Accepted');
        });

        it('should validate status value', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .put(`/api/trades/${trade._id}/status`)
                .set('Authorization', `Bearer ${receiverToken}`)
                .send({ status: 'InvalidStatus' });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/trades/:id/messages', () => {
        it('should add message to trade', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .post(`/api/trades/${trade._id}/messages`)
                .set('Authorization', `Bearer ${receiverToken}`)
                .send({ content: 'New test message' });

            expect(response.status).toBe(200);
            expect(response.body.messages).toHaveLength(1);
            expect(response.body.messages[0].content).toBe('New test message');
        });

        it('should validate message content', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .post(`/api/trades/${trade._id}/messages`)
                .set('Authorization', `Bearer ${receiverToken}`)
                .send({ content: '' });

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /api/trades/:id', () => {
        it('should delete trade', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .delete(`/api/trades/${trade._id}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(response.status).toBe(200);

            const deletedTrade = await Trade.findById(trade._id);
            expect(deletedTrade).toBeNull();
        });

        it('should only allow initiator to delete trade', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .delete(`/api/trades/${trade._id}`)
                .set('Authorization', `Bearer ${receiverToken}`);

            expect(response.status).toBe(403);
        });
    });
}); 