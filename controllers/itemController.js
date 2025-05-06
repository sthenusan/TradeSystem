const Item = require('../models/Item');

// Get all items with pagination and filters
exports.getItems = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;

        let query = {};

        // Apply filters
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.condition) {
            query.condition = req.query.condition;
        }
        if (req.query.location) {
            query.location = new RegExp(req.query.location, 'i');
        }
        if (req.query.search) {
            query.$text = { $search: req.query.search };
        }

        const items = await Item.find(query)
            .populate('owner', 'name rating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Item.countDocuments(query);
        const pages = Math.ceil(total / limit);

        res.render('items/index', {
            items,
            currentPage: page,
            pages,
            query: req.query
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Get single item
exports.getItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('owner', 'name rating location');

        if (!item) {
            return res.status(404).render('error', { message: 'Item not found' });
        }

        res.render('items/show', { item });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Create new item
exports.createItem = async (req, res) => {
    try {
        const { title, description, category, condition, location, tags } = req.body;

        const newItem = new Item({
            title,
            description,
            category,
            condition,
            location,
            tags: tags.split(',').map(tag => tag.trim()),
            images: req.files.map(file => file.filename),
            owner: req.user.id
        });

        await newItem.save();
        req.flash('success_msg', 'Item created successfully');
        res.redirect(`/items/${newItem._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Update item
exports.updateItem = async (req, res) => {
    try {
        const { title, description, category, condition, location, tags } = req.body;

        const updateData = {
            title,
            description,
            category,
            condition,
            location,
            tags: tags.split(',').map(tag => tag.trim())
        };

        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => file.filename);
        }

        const item = await Item.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            { $set: updateData },
            { new: true }
        );

        if (!item) {
            return res.status(404).render('error', { message: 'Item not found' });
        }

        req.flash('success_msg', 'Item updated successfully');
        res.redirect(`/items/${item._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Delete item
exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!item) {
            return res.status(404).render('error', { message: 'Item not found' });
        }

        req.flash('success_msg', 'Item deleted successfully');
        res.redirect('/items');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
}; 