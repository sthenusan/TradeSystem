// models/Message.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  tradeId: {
    type: Schema.Types.ObjectId,
    ref: 'Trade',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
