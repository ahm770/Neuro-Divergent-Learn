// ===== File: /middleware/authMiddleware.js =====
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if needed

const protect = async (req, res, next) => {
  let token;

  // Check for Authorization header and Bearer token format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (split 'Bearer TOKEN' and take the TOKEN part)
      token = req.headers.authorization.split(' ')[1];

      // Verify token using the secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload (ID) and attach to request
      // Exclude password from the user object attached to req
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
          // Handle case where token is valid but user doesn't exist anymore
         return res.status(401).json({ error: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware or route handler

    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

module.exports = { protect };