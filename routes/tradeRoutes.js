const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const tradeController = require('../controllers/tradeController');
const Trade = require('../models/Trade');
const Message = require('../models/Message');
const User = require('../models/User');

// Get all trades for current user
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const trades = await Trade.find({
            $or: [{ initiator: req.user.id }, { receiver: req.user.id }]
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

// Get single trade
router.get('/:id', ensureAuthenticated, tradeController.getTrade);

// Create trade form
router.get('/create/:itemId', ensureAuthenticated, async (req, res) => {
    try {
        const item = await Item.findById(req.params.itemId)
            .populate('owner', 'name rating');

        if (!item) {
            return res.status(404).render('error', { message: 'Item not found' });
        }

        // Get user's available items for trade
        const userItems = await Item.find({
            owner: req.user.id,
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

// Create trade
router.post('/', ensureAuthenticated, tradeController.createTrade);

// Update trade status
router.put('/:id/status', ensureAuthenticated, tradeController.updateTradeStatus);

// Add message to trade
router.post('/:id/messages', ensureAuthenticated, tradeController.addMessage);

// 🔓 Bypassed Chat Route (TEMP FOR DEV)
router.get('/chat/:tradeId', async (req, res) => {
    try {
        // Hardcoded logged-in user for testing: Demo Trader
        req.user = await User.findById('682c347004ec912f406c4bd0'); // Replace with actual user ID

        const trade = await Trade.findById(req.params.tradeId).populate('initiator receiver');
        if (!trade) {
            return res.status(404).render('error', { message: 'Trade not found' });
        }

        const recipient = trade.initiator._id.toString() === req.user._id.toString()
            ? trade.receiver
            : trade.initiator;

        const messages = await Message.find({ trade: trade._id }).sort({ createdAt: 1 });

        res.render('chat/chat', {
            user: req.user,
            trade,
            recipient,
            messages
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server error' });
    }
});

module.exports = router;
