const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    trade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trade',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxLength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only rate another user once per trade
ratingSchema.index({ fromUser: 1, toUser: 1, trade: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema); 