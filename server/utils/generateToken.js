// ===== File: /utils/generateToken.js =====
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  // Check if JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
      // Throw an error instead of exiting, so it can be caught by a global error handler or at startup
      throw new Error('FATAL ERROR: JWT_SECRET is not defined in .env file.');
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days (adjust as needed)
  });
};

module.exports = generateToken;