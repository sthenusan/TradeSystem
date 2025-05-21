const Trade = require('../models/Trade');
const Item = require('../models/Item');
const User = require('../models/User');

// Create new trade proposal
async function createTradeService({ initiator, receiverId, offeredItems, requestedItems, message }) {
    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
        throw new Error('Invalid receiver');
    }

    // Validate items ownership and availability
    const offeredItemsList = await Item.find({
        _id: { $in: offeredItems },
        owner: initiator,
        status: 'Available'
    });
    const requestedItemsList = await Item.find({
        _id: { $in: requestedItems },
        owner: receiverId,
        status: 'Available'
    });

    if (offeredItemsList.length !== offeredItems.length ||
        requestedItemsList.length !== requestedItems.length) {
        throw new Error('Items are not available for trade');
    }

    const newTrade = new Trade({
        initiator,
        receiver: receiverId,
        offeredItems,
        requestedItems,
        messages: [{ sender: initiator, content: message }]
    });
    await newTrade.save();

    // Update items status to pending
    await Item.updateMany(
        { _id: { $in: [...offeredItems, ...requestedItems] } },
        { status: 'Pending' }
    );
    return newTrade;
}

// Get trade details
async function getTradeService(tradeId) {
    const trade = await Trade.findById(tradeId)
        .populate('initiator', 'firstName lastName')
        .populate('receiver', 'firstName lastName')
        .populate('offeredItems')
        .populate('requestedItems')
        .populate('messages.sender', 'firstName lastName');

    if (!trade) {
        throw new Error('Trade not found');
    }
    return trade;
}

// Update trade status
async function updateTradeStatusService(tradeId, userId, status) {
    const trade = await Trade.findById(tradeId);
    if (!trade) {
        throw new Error('Trade not found');
    }

    if (!['Pending', 'Accepted', 'Rejected', 'Completed'].includes(status)) {
        throw new Error('Invalid status');
    }

    if (trade.receiver.toString() !== userId.toString()) {
        throw new Error('Not authorized');
    }

    trade.status = status;
    await trade.save();

    // Update items status based on trade status
    if (status === 'Accepted') {
        await Item.updateMany(
            { _id: { $in: [...trade.offeredItems, ...trade.requestedItems] } },
            { status: 'Traded' }
        );
    } else if (status === 'Rejected') {
        await Item.updateMany(
            { _id: { $in: [...trade.offeredItems, ...trade.requestedItems] } },
            { status: 'Available' }
        );
    }

    return trade;
}

// Add message to trade
async function addMessageService(tradeId, userId, content) {
    if (!content || content.trim() === '') {
        throw new Error('Message content is required');
    }

    const trade = await Trade.findById(tradeId);
    if (!trade) {
        throw new Error('Trade not found');
    }

    if (trade.initiator.toString() !== userId.toString() && trade.receiver.toString() !== userId.toString()) {
        throw new Error('Not authorized');
    }

    await trade.addMessage(userId, content);
    return trade;
}

module.exports = {
    createTradeService,
    getTradeService,
    updateTradeStatusService,
    addMessageService
}; 