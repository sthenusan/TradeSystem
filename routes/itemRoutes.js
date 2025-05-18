const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

router.get('/', async (req, res) => {
  const query = req.query.search || '';
  const regex = new RegExp(query, 'i');

  try {
    const items = await Item.find({
      $or: [
        { title: regex },
        { description: regex },
        { category: regex }
      ]
    });

    res.render('items', {
      items,
      searchQuery: query
    });
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
