const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['ITEM_ADDED', 'TRADE_CREATED', 'TRADE_ACCEPTED', 'TRADE_REJECTED', 'TRADE_COMPLETED'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    relatedItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
    },
    relatedTrade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trade'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', activitySchema); 