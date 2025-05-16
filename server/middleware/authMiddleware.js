// ===== File: /middleware/authMiddleware.js =====
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as needed

const protect = async (req, res, next) => {
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
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as an admin' });
  }
};

const isCreator = (req, res, next) => { 
  if (req.user && req.user.role === 'creator') {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as a creator' });
  }
};

const isCreatorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'creator')) {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as an admin or creator' });
  }
};

module.exports = { protect, isAdmin, isCreator, isCreatorOrAdmin };