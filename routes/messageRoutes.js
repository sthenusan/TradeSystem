const express = require('express');
const router = express.Router();
const { getMessagesByTrade, sendMessage } = require('../controllers/messageController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/:tradeId', authenticateUser, getMessagesByTrade);
router.post('/', authenticateUser, sendMessage);

module.exports = router;
