const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  category: String
});

// ⬇️ 3rd argument: force collection name
module.exports = mongoose.model('Item', itemSchema, 'tradesystem');
