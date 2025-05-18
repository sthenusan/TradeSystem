const tradeService = require('../services/tradeService');

// Create new trade proposal
exports.createTrade = async (req, res) => {
    try {
        const { receiverId, offeredItems, requestedItems, message } = req.body;
        const newTrade = await tradeService.createTradeService({
            initiator: req.user.id,
            receiverId,
            offeredItems,
            requestedItems,
            message
        });
        req.flash('success_msg', 'Trade proposal sent successfully');
        res.redirect(`/trades/${newTrade._id}`);
    } catch (err) {
        if (err.message === 'Invalid items selected') {
            req.flash('error_msg', err.message);
            return res.redirect('back');
        }
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Get trade details
exports.getTrade = async (req, res) => {
    try {
        const trade = await tradeService.getTradeService(req.params.id);
        if (!trade) {
            return res.status(404).render('error', { message: 'Trade not found' });
        }
        // Check if user is part of the trade
        if (trade.initiator._id.toString() !== req.user.id &&
            trade.receiver._id.toString() !== req.user.id) {
            return res.status(403).render('error', { message: 'Not authorized' });
        }
        res.render('trades/show', { trade });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Update trade status
exports.updateTradeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const trade = await tradeService.updateTradeStatusService(req.params.id, req.user.id, status);
        if (!trade) {
            return res.status(404).render('error', { message: 'Trade not found' });
        }
        req.flash('success_msg', `Trade ${status.toLowerCase()} successfully`);
        res.redirect(`/trades/${trade._id}`);
    } catch (err) {
        if (err.message === 'Not authorized') {
            return res.status(403).render('error', { message: 'Not authorized' });
        }
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Add message to trade
exports.addMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const trade = await tradeService.addMessageService(req.params.id, req.user.id, content);
        if (!trade) {
            return res.status(404).render('error', { message: 'Trade not found' });
        }
        res.redirect(`/trades/${trade._id}`);
    } catch (err) {
        if (err.message === 'Not authorized') {
            return res.status(403).render('error', { message: 'Not authorized' });
        }
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};  
