const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const itemController = require('../controllers/itemController');
const multer = require('multer');
const path = require('path');

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

// Get single item
router.get('/:id', itemController.getItem);

// Create item form
router.get('/create', ensureAuthenticated, (req, res) => {
    res.render('items/create', {
        title: 'Create Item'
    });
});

// Create item
router.post('/', ensureAuthenticated, upload.array('images', 5), itemController.createItem);

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

module.exports = router; 