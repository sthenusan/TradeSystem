const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

router.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
