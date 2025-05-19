const Item = require('../models/Item');

// Get all items with pagination and filters
async function getItemsService(queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    let query = {};

    // Category and condition filters
    if (queryParams.category) query.category = queryParams.category;
    if (queryParams.condition) query.condition = queryParams.condition;
    if (queryParams.location) query.location = new RegExp(queryParams.location, 'i');

    // Search functionality
    if (queryParams.search) {
        const searchRegex = new RegExp(queryParams.search, 'i');
        query.$or = [
            { title: searchRegex },
            { description: searchRegex }
        ];
    }

    const items = await Item.find(query)
        .populate('owner', 'name rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = await Item.countDocuments(query);
    const pages = Math.ceil(total / limit);
    return { items, currentPage: page, pages };
}

// Get single item
async function getItemService(itemId) {
    const item = await Item.findById(itemId)
        .populate('owner', 'name rating location');
    return item;
}

// Create new item
async function createItemService({ title, description, category, condition, location, images, owner }) {
    const newItem = new Item({
        title,
        description,
        category,
        condition,
        location,
        images,
        owner
    });
    await newItem.save();
    return newItem;
}

// Update item
async function updateItemService(itemId, ownerId, { title, description, category, condition, location, images }) {
    const updateData = {
        title,
        description,
        category,
        condition,
        location,
    };
    if (images && images.length > 0) updateData.images = images;
    const item = await Item.findOneAndUpdate(
        { _id: itemId, owner: ownerId },
        { $set: updateData },
        { new: true }
    );
    return item;
}

// Delete item
async function deleteItemService(itemId, ownerId) {
    const item = await Item.findOneAndDelete({ _id: itemId, owner: ownerId });
    return item;
}

module.exports = {
    getItemsService,
    getItemService,
    createItemService,
    updateItemService,
    deleteItemService
}; 