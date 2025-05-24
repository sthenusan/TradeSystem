const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const { notifyTradeProposal, notifyTradeStatusUpdate, notifyNewMessage } = require('../services/notificationService');
const { mockSendMail } = require('./mocks/notificationService');
const User = require('../models/User');
const Item = require('../models/Item');
const Trade = require('../models/Trade');

// Mock nodemailer
jest.mock('nodemailer');

describe('Notification Service', () => {
    let mockTransporter;
    let mockSendMail;
    let initiator, receiver, trade;

    beforeEach(async () => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup nodemailer mock
        mockSendMail = jest.fn();
        mockTransporter = {
            sendMail: mockSendMail
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);

        // Create test users
        initiator = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            password: 'Password123!',
            phoneNumber: '1234567890',
            address: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345'
        });

        receiver = await User.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@test.com',
            password: 'Password123!',
            phoneNumber: '0987654321',
            address: '456 Oak St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '54321'
        });

        // Create test items
        const offeredItem = await Item.create({
            title: 'Test Item 1',
            description: 'Test Description 1',
            owner: initiator._id,
            status: 'Available',
            location: 'Test Location',
            condition: 'Like New',
            category: 'Electronics',
            images: ['test-image-1.jpg'],
            value: 100
        });

        const requestedItem = await Item.create({
            title: 'Test Item 2',
            description: 'Test Description 2',
            owner: receiver._id,
            status: 'Available',
            location: 'Test Location',
            condition: 'Good',
            category: 'Books',
            images: ['test-image-2.jpg'],
            value: 100
        });

        // Create test trade
        trade = await Trade.create({
            initiator: initiator._id,
            receiver: receiver._id,
            offeredItems: [offeredItem._id],
            requestedItems: [requestedItem._id],
            status: 'Pending'
        });

        // Clear mock calls
        mockSendMail.mockClear();
    });

    test('should send trade proposal notification', async () => {
        await notifyTradeProposal(trade);

        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: receiver.email,
            subject: expect.stringContaining('New Trade Proposal'),
            html: expect.stringContaining(initiator.firstName)
        }));
    });

    test('should send trade status update notification for accepted trade', async () => {
        await notifyTradeStatusUpdate(trade, 'Accepted');

        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: initiator.email,
            subject: expect.stringContaining('Trade Accepted'),
            html: expect.stringContaining('has been accepted')
        }));
    });

    test('should send trade status update notification for completed trade', async () => {
        await notifyTradeStatusUpdate(trade, 'Completed');

        expect(mockSendMail).toHaveBeenCalledTimes(2); // Both initiator and receiver should be notified
        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: initiator.email,
            subject: expect.stringContaining('Trade Completed'),
            html: expect.stringContaining('has been completed')
        }));
        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: receiver.email,
            subject: expect.stringContaining('Trade Completed'),
            html: expect.stringContaining('has been completed')
        }));
    });

    test('should send new message notification', async () => {
        const message = 'Hello, I would like to trade!';
        await notifyNewMessage(trade, initiator, message);

        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: receiver.email,
            subject: expect.stringContaining('New Trade Message'),
            html: expect.stringContaining(message)
        }));
    });

    test('should handle email sending errors gracefully', async () => {
        // Mock email sending error
        mockSendMail.mockRejectedValueOnce(new Error('Failed to send email'));

        // Should not throw error
        await expect(notifyTradeProposal(trade)).resolves.not.toThrow();
    });
}); 