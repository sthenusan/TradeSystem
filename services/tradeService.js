const Trade = require('../models/Trade');
const Item = require('../models/Item');
const User = require('../models/User');

// Create new trade proposal
async function createTradeService({ initiator, receiverId, offeredItems, requestedItems, message }) {
    // Validate items ownership
    const offeredItemsList = await Item.find({
        _id: { $in: offeredItems },
        owner: initiator
    });
    const requestedItemsList = await Item.find({
        _id: { $in: requestedItems },
        owner: receiverId
    });
    if (offeredItemsList.length !== offeredItems.length ||
        requestedItemsList.length !== requestedItems.length) {
        throw new Error('Invalid items selected');
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
        .populate('initiator receiver', 'name rating')
        .populate('offeredItems requestedItems')
        .populate('messages.sender', 'name');
    return trade;
}

// Update trade status
async function updateTradeStatusService(tradeId, userId, status) {
    const trade = await Trade.findById(tradeId);
    if (!trade) return null;
    if (trade.receiver.toString() !== userId) throw new Error('Not authorized');
    trade.status = status;
    await trade.save();
    // Update items status based on trade status
    if (status === 'Accepted') {
        await Item.updateMany(
            { _id: { $in: [...trade.offeredItems, ...trade.requestedItems] } },
            { status: 'Traded' }
        );
        await User.updateMany(
            { _id: { $in: [trade.initiator, trade.receiver] } },
            { $inc: { totalTrades: 1 } }
        );
    } else if (status === 'Rejected' || status === 'Cancelled') {
        await Item.updateMany(
            { _id: { $in: [...trade.offeredItems, ...trade.requestedItems] } },
            { status: 'Available' }
        );
    }
    return trade;
}

// Add message to trade
async function addMessageService(tradeId, userId, content) {
    const trade = await Trade.findById(tradeId);
    if (!trade) return null;
    if (trade.initiator.toString() !== userId && trade.receiver.toString() !== userId) {
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