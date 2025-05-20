const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Item = require('../../models/Item');
const Trade = require('../../models/Trade');

describe('Trade Routes Integration Test', () => {
    let initiator, receiver, offeredItem, requestedItem, initiatorToken, receiverToken;

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

    describe('GET /api/trades/:id', () => {
        it('should get trade details', async () => {
            const trade = await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id]
            });

            const response = await request(app)
                .get(`/api/trades/${trade._id}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(response.status).toBe(200);
            expect(response.body._id.toString()).toBe(trade._id.toString());
            expect(response.body.initiator.toString()).toBe(initiator._id.toString());
            expect(response.body.receiver.toString()).toBe(receiver._id.toString());
        });

        it('should return 404 for non-existent trade', async () => {
            const response = await request(app)
                .get(`/api/trades/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/trades/user/:userId', () => {
        it('should get trades for a specific user', async () => {
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
                .get(`/api/trades/user/${initiator._id}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });
    });

    describe('GET /api/trades/status/:status', () => {
        it('should get trades by status', async () => {
            // Create trades with different statuses
            await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Pending'
            });

            await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Accepted'
            });

            const response = await request(app)
                .get('/api/trades/status/Pending')
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].status).toBe('Pending');
        });
    });

    describe('DELETE /api/trades/:id', () => {
        it('should delete a trade', async () => {
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

    describe('GET /api/trades/search', () => {
        it('should search trades by criteria', async () => {
            // Create trades with different criteria
            await Trade.create({
                initiator: initiator._id,
                receiver: receiver._id,
                offeredItems: [offeredItem._id],
                requestedItems: [requestedItem._id],
                status: 'Pending'
            });

            const response = await request(app)
                .get('/api/trades/search')
                .query({
                    status: 'Pending',
                    initiator: initiator._id
                })
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].status).toBe('Pending');
        });
    });
}); 