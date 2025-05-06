const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Other']
    },
    condition: {
        type: String,
        required: true,
        enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
    },
    images: [{
        type: String,
        required: true
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Pending', 'Traded'],
        default: 'Available'
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
itemSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create text index for search functionality
itemSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Item', itemSchema); 