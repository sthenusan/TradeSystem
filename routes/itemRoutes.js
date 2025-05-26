const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const itemController = require('../controllers/itemController');
const Activity = require('../models/Activity');
const multer = require('multer');
const path = require('path');
const itemService = require('../services/itemService');
const Item = require('../models/Item');

// Configure multer for item images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/items');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Get all items
router.get('/', itemController.getItems);

// Manage items page
router.get('/manage', ensureAuthenticated, itemController.getManageItems);

// Get available items for trade (API endpoint)
router.get('/my/available', ensureAuthenticated, async (req, res) => {
    try {
        const items = await Item.find({
            owner: req.user._id,
            status: 'Available'
        }).select('title description images');

        res.json(items);
    } catch (error) {
        console.error('Error fetching available items:', error);
        res.status(500).json({ error: 'Failed to fetch available items' });
    }
});

// Create item
router.post('/', ensureAuthenticated, upload.array('images', 5), async (req, res) => {
    try {
        const item = await itemController.createItem(req, res);

        // Create activity for new item
        await Activity.create({
            user: req.user._id,
            type: 'ITEM_ADDED',
            description: `Added new item: ${item.title}`,
            relatedItem: item._id
        });

        res.redirect('/items');
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).render('error', {
            title: 'Error',
            msg: 'Failed to create item',
            error: error
        });
    }
});

// Create item form
router.get('/create', (req, res) => {
    res.render('items/addItem', {
        title: 'Add New Item',
    });
});

// Get single item
router.get('/:id', itemController.getItem);

// Edit item form
router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
    try {
        const item = await Item.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!item) {
            return res.status(404).render('error', { message: 'Item not found' });
        }

        res.render('items/edit', {
            title: 'Edit Item',
            item
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server Error' });
    }
});

// Update item
router.put('/:id', ensureAuthenticated, upload.array('images', 5), itemController.updateItem);

// Delete item
router.delete('/:id', ensureAuthenticated, itemController.deleteItem);

// Get browse items page
router.get('/browse', async (req, res) => {
    try {
        const { items, currentPage, pages } = await itemService.getItemsService(req.query);

        res.render('items/browse', {
            title: 'Browse Items',
            items: items,
            currentPage: currentPage,
            pages: pages,
            query: req.query,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).render('error', {
            title: 'Error',
            msg: 'Failed to fetch items',
            error: error
        });
    }
});

// API: Bulk delete items
router.post('/api/bulk-delete', ensureAuthenticated, itemController.bulkDeleteItemsApi);
// API: Bulk update items
router.post('/api/bulk-update', ensureAuthenticated, itemController.bulkUpdateItemsApi);

module.exports = router; 
