const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Item = require('../../models/Item');
const Trade = require('../../models/Trade');

describe('Trade End-to-End Test', () => {
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

    describe('Complete Trade Flow', () => {
        it('should complete a full trade cycle', async () => {
            // 1. Create a trade proposal
            const createTradeResponse = await request(app)
                .post('/api/trades')
                .set('Authorization', `Bearer ${initiatorToken}`)
                .send({
                    receiverId: receiver._id,
                    offeredItems: [offeredItem._id],
                    requestedItems: [requestedItem._id],
                    message: 'Would you like to trade?'
                });

            expect(createTradeResponse.status).toBe(201);
            const tradeId = createTradeResponse.body._id;

            // 2. Verify trade details
            const tradeDetailsResponse = await request(app)
                .get(`/api/trades/${tradeId}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(tradeDetailsResponse.status).toBe(200);
            expect(tradeDetailsResponse.body.status).toBe('Pending');
            expect(tradeDetailsResponse.body.messages).toHaveLength(1);

            // 3. Add a message from receiver
            const addMessageResponse = await request(app)
                .post(`/api/trades/${tradeId}/messages`)
                .set('Authorization', `Bearer ${receiverToken}`)
                .send({ content: 'Yes, I would like to trade!' });

            expect(addMessageResponse.status).toBe(200);
            expect(addMessageResponse.body.messages).toHaveLength(2);

            // 4. Update trade status to Accepted
            const updateStatusResponse = await request(app)
                .put(`/api/trades/${tradeId}/status`)
                .set('Authorization', `Bearer ${receiverToken}`)
                .send({ status: 'Accepted' });

            expect(updateStatusResponse.status).toBe(200);
            expect(updateStatusResponse.body.status).toBe('Accepted');

            // 5. Verify item statuses are updated
            const updatedOfferedItem = await Item.findById(offeredItem._id);
            const updatedRequestedItem = await Item.findById(requestedItem._id);
            expect(updatedOfferedItem.status).toBe('Traded');
            expect(updatedRequestedItem.status).toBe('Traded');

            // 6. Verify trade appears in both users' trade lists
            const initiatorTradesResponse = await request(app)
                .get(`/api/trades/user/${initiator._id}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            const receiverTradesResponse = await request(app)
                .get(`/api/trades/user/${receiver._id}`)
                .set('Authorization', `Bearer ${receiverToken}`);

            expect(initiatorTradesResponse.status).toBe(200);
            expect(receiverTradesResponse.status).toBe(200);
            expect(initiatorTradesResponse.body.length).toBe(1);
            expect(receiverTradesResponse.body.length).toBe(1);
        });

        it('should handle a rejected trade', async () => {
            // 1. Create a trade proposal
            const createTradeResponse = await request(app)
                .post('/api/trades')
                .set('Authorization', `Bearer ${initiatorToken}`)
                .send({
                    receiverId: receiver._id,
                    offeredItems: [offeredItem._id],
                    requestedItems: [requestedItem._id],
                    message: 'Would you like to trade?'
                });

            expect(createTradeResponse.status).toBe(201);
            const tradeId = createTradeResponse.body._id;

            // 2. Add a message from receiver
            await request(app)
                .post(`/api/trades/${tradeId}/messages`)
                .set('Authorization', `Bearer ${receiverToken}`)
                .send({ content: 'No, thank you.' });

            // 3. Update trade status to Rejected
            const updateStatusResponse = await request(app)
                .put(`/api/trades/${tradeId}/status`)
                .set('Authorization', `Bearer ${receiverToken}`)
                .send({ status: 'Rejected' });

            expect(updateStatusResponse.status).toBe(200);
            expect(updateStatusResponse.body.status).toBe('Rejected');

            // 4. Verify item statuses remain Available
            const updatedOfferedItem = await Item.findById(offeredItem._id);
            const updatedRequestedItem = await Item.findById(requestedItem._id);
            expect(updatedOfferedItem.status).toBe('Available');
            expect(updatedRequestedItem.status).toBe('Available');
        });

        it('should handle a cancelled trade', async () => {
            // 1. Create a trade proposal
            const createTradeResponse = await request(app)
                .post('/api/trades')
                .set('Authorization', `Bearer ${initiatorToken}`)
                .send({
                    receiverId: receiver._id,
                    offeredItems: [offeredItem._id],
                    requestedItems: [requestedItem._id],
                    message: 'Would you like to trade?'
                });

            expect(createTradeResponse.status).toBe(201);
            const tradeId = createTradeResponse.body._id;

            // 2. Delete the trade (cancellation)
            const deleteResponse = await request(app)
                .delete(`/api/trades/${tradeId}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(deleteResponse.status).toBe(200);

            // 3. Verify trade is deleted
            const getTradeResponse = await request(app)
                .get(`/api/trades/${tradeId}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(getTradeResponse.status).toBe(404);

            // 4. Verify item statuses remain Available
            const updatedOfferedItem = await Item.findById(offeredItem._id);
            const updatedRequestedItem = await Item.findById(requestedItem._id);
            expect(updatedOfferedItem.status).toBe('Available');
            expect(updatedRequestedItem.status).toBe('Available');
        });

        it('should handle multiple messages in a trade', async () => {
            // 1. Create a trade proposal
            const createTradeResponse = await request(app)
                .post('/api/trades')
                .set('Authorization', `Bearer ${initiatorToken}`)
                .send({
                    receiverId: receiver._id,
                    offeredItems: [offeredItem._id],
                    requestedItems: [requestedItem._id],
                    message: 'Would you like to trade?'
                });

            expect(createTradeResponse.status).toBe(201);
            const tradeId = createTradeResponse.body._id;

            // 2. Add multiple messages
            const messages = [
                'I have some questions about the item.',
                'Sure, what would you like to know?',
                'Is it in good condition?',
                'Yes, it\'s like new!'
            ];

            for (const message of messages) {
                const sender = message.includes('?') ? receiverToken : initiatorToken;
                const response = await request(app)
                    .post(`/api/trades/${tradeId}/messages`)
                    .set('Authorization', `Bearer ${sender}`)
                    .send({ content: message });

                expect(response.status).toBe(200);
            }

            // 3. Verify all messages are saved
            const tradeDetailsResponse = await request(app)
                .get(`/api/trades/${tradeId}`)
                .set('Authorization', `Bearer ${initiatorToken}`);

            expect(tradeDetailsResponse.status).toBe(200);
            expect(tradeDetailsResponse.body.messages).toHaveLength(messages.length + 1); // +1 for initial message
        });
    });
}); 