const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Trade = require('../models/Trade');
const User = require('../models/User');
const Item = require('../models/Item');
const mongoose = require('mongoose');

// Inbox: list of trades where user is initiator or receiver
router.get('/chat', ensureAuthenticated, async (req, res) => {
  try {
    const trades = await Trade.find({
      $or: [{ initiator: req.user._id }, { receiver: req.user._id }]
    })
      .populate('initiator receiver')
      .sort({ updatedAt: -1 });

    res.render('chat/inbox', {
      title: 'My Messages',
      trades,
      user: req.user
    });
  } catch (err) {
    console.error('Inbox Error:', err);
    res.status(500).render('error', { title: 'Error', message: 'Could not load inbox' });
  }
});

// Chat page for a specific trade
router.get('/chat/:tradeId', ensureAuthenticated, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.tradeId)
      .populate('initiator receiver')
      .populate('messages.sender');

    if (!trade) {
      return res.status(404).render('error', { title: 'Error', message: 'Trade not found' });
    }

    const partner =
      trade.initiator._id.toString() === req.user._id.toString()
        ? trade.receiver
        : trade.initiator;

    res.render('chat/chat', {
      trade,
      partnerName: partner.firstName,
      user: req.user
    });
  } catch (err) {
    console.error('Chat thread error:', err);
    res.status(500).render('error', { title: 'Error', message: 'Could not load chat' });
  }
});

// Send a message in trade
router.post('/:id/messages', ensureAuthenticated, async (req, res) => {
  try {
    const { content } = req.body;
    const trade = await Trade.findById(req.params.id);

    if (!trade) {
      return res.status(404).render('error', { title: 'Error', message: 'Trade not found' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).render('error', { title: 'Error', message: 'Message content is required' });
    }

    const isParticipant =
      trade.initiator.toString() === req.user._id.toString() ||
      trade.receiver.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).render('error', { title: 'Error', message: 'Not authorized' });
    }

    trade.messages.push({
      sender: req.user._id,
      content
    });

    await trade.save();
    res.redirect(`/trades/chat/${trade._id}`);
  } catch (err) {
    console.error('Message post error:', err);
    res.status(500).render('error', { title: 'Error', message: 'Could not send message' });
  }
});

// Other routes (create, list, etc.) go below...
// Example for listing trades:
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const trades = await Trade.find({
      $or: [
        { initiator: req.user._id },
        { receiver: req.user._id }
      ]
    })
      .populate('initiator receiver')
      .populate('offeredItems requestedItems')
      .sort({ updatedAt: -1 });

    res.render('trades/index', {
      title: 'My Trades',
      trades,
      user: req.user
    });
  } catch (err) {
    console.error('Trade list error:', err);
    res.status(500).render('error', { title: 'Error', message: 'Could not load trades' });
  }
});

module.exports = router;
