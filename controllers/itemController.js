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
        const { title, description, category, condition, location } = req.body;
        const images = Array.isArray(req.files) ? req.files.map(file => file.filename) : [];

        // TODO: Add owner
        // const owner = req.user.id;
        // Create a valid ObjectId for testing (24 characters)
        const owner = "65f1a1234567890123456789";

        // Validate required fields
        if (!title || !description || !category || !condition || !location) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide all required fields'
                });
            }
            req.flash('error_msg', 'Please provide all required fields');
            return res.redirect('/items/create');
        }

        const newItem = await itemService.createItemService({
            title,
            description,
            category,
            condition,
            location,
            images,
            owner
        });

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(201).json({
                success: true,
                message: 'Item created successfully',
                data: newItem
            });
        }

        req.flash('success_msg', 'Item created successfully');
        // TODO: Redirect to the manage items page
        // res.redirect(`/items/${newItem._id}`);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({
                success: false,
                message: 'Server Error',
                error: err.message
            });
        }
        res.status(500).render('error', { message: 'Server Error' });
    }
};

// Update item
exports.updateItem = async (req, res) => {
    try {
        const { title, description, category, condition, location } = req.body;
        const images = Array.isArray(req.files) && req.files.length > 0 ? req.files.map(file => file.filename) : undefined;
        const item = await itemService.updateItemService(
            req.params.id,
            req.user.id,
            { title, description, category, condition, location, images }
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