const mongoose = require('mongoose');
const Trade = require('../../../models/Trade');
const User = require('../../../models/User');
const Item = require('../../../models/Item');

describe('Trade Model Test', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-system-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Trade.deleteMany({});
        await User.deleteMany({});
        await Item.deleteMany({});
    });

    it('should create & save trade successfully', async () => {
        const initiator = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const receiver = await User.create({
            firstName: 'Other',
            lastName: 'User',
            email: 'other@example.com',
            password: 'Test123!@#'
        });

        const offeredItem = await Item.create({
            title: 'Test Item',
            description: 'Test Description',
            owner: initiator._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const requestedItem = await Item.create({
            title: 'Other Item',
            description: 'Other Description',
            owner: receiver._id,
            category: 'Electronics',
            condition: 'New',
            status: 'Available',
            location: 'Test Location'
        });

        const validTrade = new Trade({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            status: 'Pending',
            messages: [{
                sender: initiator._id,
                content: 'Initial trade proposal'
            }]
        });

        const savedTrade = await validTrade.save();
        expect(savedTrade._id).toBeDefined();
        expect(savedTrade.initiator.toString()).toBe(initiator._id.toString());
        expect(savedTrade.receiver.toString()).toBe(receiver._id.toString());
        expect(savedTrade.status).toBe('Pending');
        expect(savedTrade.messages).toHaveLength(1);
        expect(savedTrade.messages[0].content).toBe('Initial trade proposal');
    });

    it('should fail to save trade without required fields', async () => {
        const tradeWithoutRequiredField = new Trade({ status: 'Pending' });
        let err;
        try {
            await tradeWithoutRequiredField.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.initiator).toBeDefined();
        expect(err.errors.receiver).toBeDefined();
    });

    it('should fail to save trade with invalid status', async () => {
        const initiator = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const receiver = await User.create({
            firstName: 'Other',
            lastName: 'User',
            email: 'other@example.com',
            password: 'Test123!@#'
        });

        const tradeWithInvalidStatus = new Trade({
            initiator: initiator._id,
            receiver: receiver._id,
            status: 'InvalidStatus'
        });

        let err;
        try {
            await tradeWithInvalidStatus.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.status).toBeDefined();
    });

    it('should update trade status successfully', async () => {
        const initiator = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const receiver = await User.create({
            firstName: 'Other',
            lastName: 'User',
            email: 'other@example.com',
            password: 'Test123!@#'
        });

        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            status: 'Pending'
        });

        const updatedTrade = await Trade.findByIdAndUpdate(
            trade._id,
            { status: 'Accepted' },
            { new: true }
        );

        expect(updatedTrade.status).toBe('Accepted');
    });

    it('should add message to trade successfully', async () => {
        const initiator = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const receiver = await User.create({
            firstName: 'Other',
            lastName: 'User',
            email: 'other@example.com',
            password: 'Test123!@#'
        });

        const trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            status: 'Pending',
            messages: [{
                sender: initiator._id,
                content: 'Initial message'
            }]
        });

        const updatedTrade = await Trade.findByIdAndUpdate(
            trade._id,
            {
                $push: {
                    messages: {
                        sender: receiver._id,
                        content: 'New message'
                    }
                }
            },
            { new: true }
        );

        expect(updatedTrade.messages).toHaveLength(2);
        expect(updatedTrade.messages[1].content).toBe('New message');
        expect(updatedTrade.messages[1].sender.toString()).toBe(receiver._id.toString());
    });
}); 