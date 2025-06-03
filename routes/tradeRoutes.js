const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const tradeController = require('../controllers/tradeController');
const Trade = require('../models/Trade');
const Message = require('../models/Message');
const User = require('../models/User');
const Item = require('../models/Item'); // Needed in create route

// ✅ NEW ROUTE: Chat Inbox (MUST COME BEFORE `/:id`)
router.get('/chat', ensureAuthenticated, async (req, res) => {
    try {
        const trades = await Trade.find({
            $or: [{ initiator: req.user._id }, { receiver: req.user._id }]
        }).populate('initiator receiver', 'firstName');

        res.render('chat/inbox', {
            title: 'My Messages',
            trades,
            user: req.user
        });
    } catch (err) {
        console.error('Inbox route error:', err);
        res.status(500).render('error', { message: 'Failed to load inbox' });
    }
});

// ✅ NEW ROUTE: Chat for a specific trade
router.get('/chat/:tradeId', ensureAuthenticated, async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.tradeId)
            .populate('initiator receiver')
            .populate({
                path: 'messages',
                populate: { path: 'sender', select: 'firstName' }
            });

        if (!trade) {
            return res.status(404).render('error', { message: 'Trade not found' });
        }

        const recipient = trade.initiator._id.equals(req.user._id)
            ? trade.receiver
            : trade.initiator;

        res.render('chat/chat', {
            title: 'Chat Room',
            user: req.user,
            trade,
            recipient,
            messages: trade.messages
        });
    } catch (err) {
        console.error('Chat thread error:', err);
        res.status(500).render('error', { message: 'Failed to load chat' });
    }
});

// 🔹 GET: All trades for current user
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const trades = await Trade.find({
            $or: [{ initiator: req.user._id }, { receiver: req.user._id }]
        })
            .populate('initiator receiver', 'name rating')
            .populate('offeredItems requestedItems')
            .sort({ updatedAt: -1 });

        res.render('trades/index', {
            title: 'My Trades',
            trades
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
});

// 🔹 GET: Create Trade Form
router.get('/create/:itemId', ensureAuthenticated, async (req, res) => {
    try {
        const item = await Item.findById(req.params.itemId)
            .populate('owner', 'name rating');

        if (!item) {
            return res.status(404).render('error', { message: 'Item not found' });
        }

        const userItems = await Item.find({
            owner: req.user._id,
            status: 'Available'
        });

        res.render('trades/create', {
            title: 'Create Trade',
            item,
            userItems
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
});

// 🔹 POST: Create Trade
router.post('/', ensureAuthenticated, tradeController.createTrade);

// 🔹 PUT: Update Trade Status
router.put('/:id/status', ensureAuthenticated, tradeController.updateTradeStatus);

// 🔹 POST: Add Message
router.post('/:id/messages', ensureAuthenticated, tradeController.addMessage);

// 🔹 GET: Trade Details (MUST BE LAST!)
router.get('/:id', ensureAuthenticated, tradeController.getTrade);

module.exports = router;
