// ===== File: /middleware/authMiddleware.js =====
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  // ... (existing protect function remains unchanged)
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ error: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Not authorized, token invalid' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Not authorized, token expired' });
      }
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

// --- NEW: isAdmin Middleware ---
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized. Admin privileges required.' });
  }
};