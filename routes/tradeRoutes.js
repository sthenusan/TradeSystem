const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Trade = require('../models/Trade');
const Item = require('../models/Item');
const Activity = require('../models/Activity');
const User = require('../models/User');
const multer = require('multer');
const upload = multer();
const mongoose = require('mongoose');
const tradeController = require('../controllers/tradeController');

// Helper function to determine if request is API
const isApiRequest = (req) => {
    return req.path.startsWith('/api/') || req.headers.accept?.includes('application/json');
};

// Get all trades for the logged-in user
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const trades = await Trade.find({
            $or: [
                { initiator: req.user._id },
                { receiver: req.user._id }
            ]
        })
        .populate('initiator', 'firstName lastName email')
        .populate('receiver', 'firstName lastName email')
        .populate('offeredItems')
        .populate('requestedItems')
        .sort({ updatedAt: -1 });

        if (isApiRequest(req)) {
            return res.json(trades);
        }

        res.render('trades/index', {
            title: 'My Trades',
            trades: trades,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching trades:', error);
        if (isApiRequest(req)) {
            return res.status(500).json({ error: 'Failed to fetch trades' });
        }
        res.status(500).render('error', {
            title: 'Error',
            msg: 'Failed to fetch trades',
            error: error
        });
    }
});

// Create trade
router.post('/', ensureAuthenticated, upload.none(), async (req, res) => {
    try {
        console.log('\n=== TRADE CREATION REQUEST ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));

        // Parse JSON strings back into arrays
        const requestedItems = JSON.parse(req.body.requestedItems);
        const offeredItems = JSON.parse(req.body.offeredItems);
        const receiverId = req.body.receiverId;
        const message = req.body.message;

        console.log('\nParsed Values:');
        console.log('- requestedItems:', requestedItems);
        console.log('- offeredItems:', offeredItems);
        console.log('- receiverId:', receiverId);
        console.log('- message:', message);

        if (!receiverId || !offeredItems || !requestedItems) {
            console.log('\nMissing Fields Check:');
            console.log('- receiverId missing:', !receiverId);
            console.log('- offeredItems missing:', !offeredItems);
            console.log('- requestedItems missing:', !requestedItems);
            
            if (isApiRequest(req)) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            return res.status(400).render('error', {
                title: 'Error',
                msg: 'Missing required fields',
                error: { status: 400 }
            });
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            if (isApiRequest(req)) {
                return res.status(400).json({ error: 'Invalid receiver ID' });
            }
            return res.status(400).render('error', {
                title: 'Error',
                msg: 'Invalid receiver ID',
                error: { status: 400 }
            });
        }

        // Get the requested item to find its owner
        const requestedItemDoc = await Item.findById(requestedItems[0]).populate('owner', 'firstName lastName');
        if (!requestedItemDoc) {
            if (isApiRequest(req)) {
                return res.status(404).json({ error: 'Requested item not found' });
            }
            return res.status(404).render('error', {
                title: 'Error',
                msg: 'Requested item not found',
                error: { status: 404 }
            });
        }

        // Validate that offered items belong to the current user
        const offeredItemsList = await Item.find({
            _id: { $in: offeredItems },
            owner: req.user._id
        });

        if (offeredItemsList.length !== offeredItems.length) {
            if (isApiRequest(req)) {
                return res.status(400).json({ error: 'Invalid items selected for trade' });
            }
            return res.status(400).render('error', {
                title: 'Error',
                msg: 'Invalid items selected for trade',
                error: { status: 400 }
            });
        }

        // Set all items involved in the trade to 'Pending' status
        const allItems = [...offeredItemsList, requestedItemDoc];
        for (const item of allItems) {
            await Item.findByIdAndUpdate(item._id, { status: 'Pending' });
        }

        const trade = await Trade.create({
            initiator: req.user._id,
            receiver: requestedItemDoc.owner._id,
            requestedItems: requestedItems,
            offeredItems: offeredItems,
            status: 'Pending',
            messages: [{
                sender: req.user._id,
                content: message || 'Trade proposal'
            }]
        });

        // Create activity for new trade
        await Activity.create({
            user: req.user._id,
            type: 'TRADE_CREATED',
            description: 'Proposed a new trade',
            relatedTrade: trade._id
        });

        if (isApiRequest(req)) {
            return res.status(201).json(trade);
        }

        req.flash('success_msg', 'Trade proposal sent successfully');
        return res.redirect('/trades');
    } catch (error) {
        console.error('Error creating trade:', error);
        if (isApiRequest(req)) {
            return res.status(500).json({ error: 'Failed to create trade' });
        }
        res.status(500).render('error', {
            title: 'Error',
            msg: 'Failed to create trade',
            error: error
        });
    }
});

// Get trade details
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.id)
            .populate('initiator', 'firstName lastName email')
            .populate('receiver', 'firstName lastName email')
            .populate('offeredItems')
            .populate('requestedItems')
            .populate('messages.sender', 'firstName lastName');

        if (!trade) {
            if (isApiRequest(req)) {
                return res.status(404).json({ error: 'Trade not found' });
            }
            return res.status(404).render('error', {
                title: 'Error',
                message: 'Trade not found'
            });
        }

        // Check if user is part of this trade
        if (trade.initiator._id.toString() !== req.user._id.toString() &&
            trade.receiver._id.toString() !== req.user._id.toString()) {
            if (isApiRequest(req)) {
                return res.status(403).json({ error: 'Not authorized to view this trade' });
            }
            return res.status(403).render('error', {
                title: 'Error',
                message: 'Not authorized to view this trade'
            });
        }

        if (isApiRequest(req)) {
            return res.json(trade);
        }

        res.render('trades/show', {
            title: 'Trade Details',
            trade: trade,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching trade details:', error);
        if (isApiRequest(req)) {
            return res.status(500).json({ error: 'Failed to fetch trade details' });
        }
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to fetch trade details'
        });
    }
});

// Update trade status
router.put('/:id/status', ensureAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        const trade = await Trade.findById(req.params.id);

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        // Check if user is authorized to update status
        if (trade.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to update trade status' });
        }

        if (!['Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        trade.status = status;
        await trade.save();

        if (isApiRequest(req)) {
            return res.json(trade);
        }

        res.redirect(`/trades/${trade._id}`);
    } catch (error) {
        console.error('Error updating trade status:', error);
        if (isApiRequest(req)) {
            return res.status(500).json({ error: 'Failed to update trade status' });
        }
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to update trade status'
        });
    }
});

// Add message to trade
router.post('/:id/messages', ensureAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;
        const trade = await Trade.findById(req.params.id);

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content is required' });
        }

        // Check if user is part of this trade
        if (trade.initiator.toString() !== req.user._id.toString() &&
            trade.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to message in this trade' });
        }

        await trade.addMessage(req.user._id, content);
        
        if (isApiRequest(req)) {
            return res.json(trade);
        }

        res.redirect(`/trades/${trade._id}`);
    } catch (error) {
        console.error('Error adding message:', error);
        if (isApiRequest(req)) {
            return res.status(500).json({ error: 'Failed to add message' });
        }
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to add message'
        });
    }
});

// Delete trade
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.id);

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        // Only initiator can delete the trade
        if (trade.initiator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this trade' });
        }

        // Set items back to Available
        await Item.updateMany(
            { _id: { $in: [...trade.offeredItems, ...trade.requestedItems] } },
            { status: 'Available' }
        );

        await trade.deleteOne();

        if (isApiRequest(req)) {
            return res.json({ message: 'Trade deleted successfully' });
        }

        res.redirect('/trades');
    } catch (error) {
        console.error('Error deleting trade:', error);
        if (isApiRequest(req)) {
            return res.status(500).json({ error: 'Failed to delete trade' });
        }
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to delete trade'
        });
    }
});

// Rate trade partner
router.post('/:id/rate', ensureAuthenticated, tradeController.rateTradePartner);

module.exports = router; 