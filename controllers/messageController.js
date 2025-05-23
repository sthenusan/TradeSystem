const Message = require('../models/Message');

exports.getMessagesByTrade = async (req, res) => {
  try {
    const messages = await Message.find({ trade: req.params.tradeId })
      .sort({ createdAt: 1 })
      .populate('sender recipient');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, tradeId, content } = req.body;
    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      trade: tradeId,
      content
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
};
