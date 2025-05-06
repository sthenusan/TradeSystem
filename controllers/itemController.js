const itemService = require('../services/itemService');

// Get all items with pagination and filters
exports.getItems = async (req, res) => {
    try {
        const { items, currentPage, pages } = await itemService.getItemsService(req.query);
        res.render('items/index', {
            items,
            currentPage,
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
        const item = await itemService.getItemService(req.params.id);
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
        const images = req.files.map(file => file.filename);
        const owner = req.user.id;
        const newItem = await itemService.createItemService({
            title,
            description,
            category,
            condition,
            location,
            tags,
            images,
            owner
        });
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
        const images = req.files && req.files.length > 0 ? req.files.map(file => file.filename) : undefined;
        const item = await itemService.updateItemService(
            req.params.id,
            req.user.id,
            { title, description, category, condition, location, tags, images }
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
        const item = await itemService.deleteItemService(req.params.id, req.user.id);
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