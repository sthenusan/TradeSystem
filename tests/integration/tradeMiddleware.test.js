const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Item = require('../../models/Item');
const Trade = require('../../models/Trade');

describe('Trade Middleware Integration Test', () => {
    let initiator, receiver, thirdUser, offeredItem, requestedItem;
    let initiatorToken, receiverToken, thirdUserToken;

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

        thirdUser = await User.create({
            name: 'Third User',
            email: 'third@test.com',
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

        const thirdUserLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'third@test.com', password: 'password123' });
        thirdUserToken = thirdUserLogin.body.token;
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

    describe('Authentication Middleware', () => {
        it('should require authentication for trade creation', async () => {
            const response = await request(app)
                .post('/api/trades')
                .send({
                    receiverId: receiver._id,
                    offeredItems: [offeredItem._id],
                    requestedItems: [requestedItem._id]
                });

            expect(response.status).toBe(401);
        });

        it('should require authentication for trade updates', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .put(`/api/trades/${trade._id}/status`)
                .send({ status: 'Accepted' });

            expect(response.status).toBe(401);
        });
    });

    describe('Trade Authorization Middleware', () => {
        it('should only allow trade participants to view trade details', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .get(`/api/trades/${trade._id}`)
                .set('Authorization', `Bearer ${thirdUserToken}`);

            expect(response.status).toBe(403);
        });

        it('should only allow receiver to update trade status', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .put(`/api/trades/${trade._id}/status`)
                .set('Authorization', `Bearer ${initiatorToken}`)
                .send({ status: 'Accepted' });

            expect(response.status).toBe(403);
        });

        it('should only allow trade participants to add messages', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .post(`/api/trades/${trade._id}/messages`)
                .set('Authorization', `Bearer ${thirdUserToken}`)
                .send({ content: 'Test message' });

            expect(response.status).toBe(403);
        });
    });

    describe('Trade Validation Middleware', () => {
        it('should validate trade creation data', async () => {
            const response = await request(app)
                .post('/api/trades')
                .set('Authorization', `Bearer ${initiatorToken}`)
                .send({
                    receiverId: receiver._id,
                    // Missing required fields
                });

            expect(response.status).toBe(400);
        });

        it('should validate trade status updates', async () => {
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
                .send({ content: '' }); // Empty message

            expect(response.status).toBe(400);
        });
    });
}); 