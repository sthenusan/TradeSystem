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

        res.render('trades/index', {
            title: 'My Trades',
            trades: trades,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching trades:', error);
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
        let { requestedItem, offeredItems, message } = req.body;
        // Always treat offeredItems as an array
        if (!Array.isArray(offeredItems)) {
            offeredItems = offeredItems ? [offeredItems] : [];
        }
        // Debug log
        console.log('BODY:', req.body);
        if (!mongoose.Types.ObjectId.isValid(requestedItem)) {
            return res.status(400).json({ success: false, message: 'Invalid requestedItem ObjectId', requestedItem });
        }
        if (offeredItems.some(id => !mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ success: false, message: 'Invalid offeredItems ObjectId', offeredItems });
        }

        if (!requestedItem) {
            return res.status(400).render('error', {
                title: 'Error',
                msg: 'No item specified for trade',
                error: { status: 400 }
            });
        }

        if (!offeredItems || (Array.isArray(offeredItems) && offeredItems.length === 0)) {
            return res.status(400).render('error', {
                title: 'Error',
                msg: 'Please select at least one item to offer',
                error: { status: 400 }
            });
        }

        // Get the requested item to find its owner
        const requestedItemDoc = await Item.findById(requestedItem).populate('owner', 'firstName lastName');
        if (!requestedItemDoc) {
            return res.status(404).render('error', {
                title: 'Error',
                msg: 'Requested item not found',
                error: { status: 404 }
            });
        }

        // Validate that offered items belong to the current user
        const offeredItemsList = await Item.find({
            _id: { $in: Array.isArray(offeredItems) ? offeredItems : [offeredItems] },
            owner: req.user._id
        });

        if (offeredItemsList.length !== (Array.isArray(offeredItems) ? offeredItems.length : 1)) {
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
            requestedItems: [requestedItem],
            offeredItems: Array.isArray(offeredItems) ? offeredItems : [offeredItems],
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

        // Respond with JSON for AJAX, or redirect for normal form
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({ success: true, message: 'Trade proposal sent successfully', tradeId: trade._id });
        } else {
            req.flash('success_msg', 'Trade proposal sent successfully');
            return res.redirect('/trades');
        }
    } catch (error) {
        console.error('Error creating trade:', error);
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
            .populate('initiator', 'name email')
            .populate('receiver', 'name email')
            .populate('offeredItems')
            .populate('requestedItems');

        if (!trade) {
            return res.status(404).render('error', {
                title: 'Error',
                message: 'Trade not found'
            });
        }

        // Check if user is part of this trade
        if (trade.initiator._id.toString() !== req.user._id.toString() &&
            trade.receiver._id.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', {
                title: 'Error',
                message: 'Not authorized to view this trade'
            });
        }

        res.render('trades/show', {
            title: 'Trade Details',
            trade: trade,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching trade details:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to fetch trade details'
        });
    }
});

// Update trade status
router.post('/:id/status', ensureAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        const trade = await Trade.findById(req.params.id);

        if (!trade) {
            return res.status(404).render('error', {
                title: 'Error',
                message: 'Trade not found'
            });
        }

        // Check if user is authorized to update status
        if (trade.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', {
                title: 'Error',
                message: 'Not authorized to update trade status'
            });
        }

        trade.status = status;
        await trade.save();

        res.redirect(`/trades/${trade._id}`);
    } catch (error) {
        console.error('Error updating trade status:', error);
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
            return res.status(404).render('error', {
                title: 'Error',
                message: 'Trade not found'
            });
        }

        // Check if user is part of this trade
        if (trade.initiator.toString() !== req.user._id.toString() &&
            trade.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', {
                title: 'Error',
                message: 'Not authorized to message in this trade'
            });
        }

        await trade.addMessage(req.user._id, content);
        res.redirect(`/trades/${trade._id}`);
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to add message'
        });
    }
});

// Accept trade
router.post('/:id/accept', ensureAuthenticated, async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.id);
        if (!trade) {
            return res.status(404).render('error', {
                title: 'Error',
                msg: 'Trade not found',
                error: { status: 404 }
            });
        }

        trade.status = 'accepted';
        await trade.save();

        // Create activity for accepted trade
        await Activity.create({
            user: req.user._id,
            type: 'TRADE_ACCEPTED',
            description: 'Accepted a trade offer',
            relatedTrade: trade._id
        });

        res.redirect('/trades');
    } catch (error) {
        console.error('Error accepting trade:', error);
        res.status(500).render('error', {
            title: 'Error',
            msg: 'Failed to accept trade',
            error: error
        });
    }
});

// Complete trade
router.post('/:id/complete', ensureAuthenticated, async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.id)
            .populate('offeredItems')
            .populate('requestedItems')
            .populate('initiator', 'firstName lastName')
            .populate('receiver', 'firstName lastName');
        
        if (!trade) {
            return res.status(404).render('error', { error: 'Trade not found' });
        }
        
        // Robust check if user is part of the trade
        const initiatorId = trade.initiator._id ? trade.initiator._id.toString() : trade.initiator.toString();
        const receiverId = trade.receiver._id ? trade.receiver._id.toString() : trade.receiver.toString();
        if (![initiatorId, receiverId].includes(req.user._id.toString())) {
            return res.status(403).render('error', { error: 'Not authorized' });
        }
        
        // Update trade status
        trade.status = 'Completed';
        await trade.save();
        
        // Update status of all items involved in the trade to 'Traded'
        const allItems = [...trade.offeredItems, ...trade.requestedItems];
        for (const item of allItems) {
            await Item.findByIdAndUpdate(item._id, { status: 'Traded' });
        }
        
        // Increment totalTrades for both users
        await User.updateMany(
            { _id: { $in: [trade.initiator, trade.receiver] } },
            { $inc: { totalTrades: 1 } }
        );
        
        // Redirect to the items page after completion
        res.redirect('/items');
    } catch (error) {
        console.error('Error completing trade:', error);
        res.status(500).render('error', { error: 'Error completing trade' });
    }
});

// Reject trade
router.post('/:id/reject', ensureAuthenticated, async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.id)
            .populate('offeredItems')
            .populate('requestedItems');
            
        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }
        
        // Check if user is authorized to reject the trade
        if (trade.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        // Set all items back to 'Available' status
        const allItems = [...trade.offeredItems, ...trade.requestedItems];
        for (const item of allItems) {
            await Item.findByIdAndUpdate(item._id, { status: 'Available' });
        }
        
        // Update trade status
        trade.status = 'Rejected';
        await trade.save();
        
        // Create activity for rejected trade
        await Activity.create({
            user: req.user._id,
            type: 'TRADE_REJECTED',
            description: 'Rejected a trade offer',
            relatedTrade: trade._id
        });
        
        res.json({ 
            success: true, 
            message: 'Trade rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting trade:', error);
        res.status(500).json({ error: 'Error rejecting trade' });
    }
});

module.exports = router; 