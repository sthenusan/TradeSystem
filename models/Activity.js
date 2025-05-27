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
    }
}, {
    timestamps: true // This will add createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('Activity', activitySchema); 