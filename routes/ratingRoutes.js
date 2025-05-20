const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

// Submit a rating
router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const { tradeId, toUserId, rating, comment } = req.body;
        
        // Create the rating
        const newRating = new Rating({
            fromUser: req.user._id,
            toUser: toUserId,
            trade: tradeId,
            rating: parseInt(rating),
            comment
        });
        
        await newRating.save();
        
        // Update user's average rating
        const ratings = await Rating.find({ toUser: toUserId });
        const averageRating = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;
        
        await User.findByIdAndUpdate(toUserId, {
            $set: { averageRating: averageRating.toFixed(1) }
        });
        
        res.status(200).json({ message: 'Rating submitted successfully' });
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ error: 'Error submitting rating' });
    }
});

// Get ratings for a user
router.get('/user/:userId', ensureAuthenticated, async (req, res) => {
    try {
        const ratings = await Rating.find({ toUser: req.params.userId })
            .populate('fromUser', 'name')
            .sort({ createdAt: -1 });
            
        res.json(ratings);
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ error: 'Error fetching ratings' });
    }
});

module.exports = router; 