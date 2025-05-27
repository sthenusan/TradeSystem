// middleware/authMiddleware.js

exports.authenticateUser = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
};
