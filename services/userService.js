const User = require('../models/User');
const Item = require('../models/Item');
const Trade = require('../models/Trade');

// Get user profile data
async function getProfileDataService(userId) {
    const user = await User.findById(userId).select('-password');
    const items = await Item.find({ owner: userId });
    const trades = await Trade.find({
        $or: [{ initiator: userId }, { receiver: userId }]
    }).populate('offeredItems requestedItems');
    return { user, items, trades };
}

// Update user profile
async function updateProfileService(userId, { name, location, bio, profilePicture }) {
    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (bio) updateData.bio = bio;
    if (profilePicture) updateData.profilePicture = profilePicture;
    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
    ).select('-password');
    return user;
}

// Get user's items
async function getUserItemsService(userId) {
    const items = await Item.find({ owner: userId }).sort({ createdAt: -1 });
    return items;
}

// Get user's trades
async function getUserTradesService(userId) {
    const trades = await Trade.find({
        $or: [{ initiator: userId }, { receiver: userId }]
    })
        .populate('initiator receiver offeredItems requestedItems')
        .sort({ updatedAt: -1 });
    return trades;
}

// Delete user account and related data
async function deleteAccountService(userId) {
    await Item.deleteMany({ owner: userId });
    await Trade.deleteMany({
        $or: [{ initiator: userId }, { receiver: userId }]
    });
    await User.findByIdAndDelete(userId);
}

module.exports = {
    getProfileDataService,
    updateProfileService,
    getUserItemsService,
    getUserTradesService,
    deleteAccountService
}; 