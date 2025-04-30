// ===== File: /server/utils/generateToken.js =====
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  // Check if JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
      console.error('FATAL ERROR: JWT_SECRET is not defined in .env file.');
      process.exit(1); // Exit the process if the secret is missing
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days (adjust as needed)
  });
};

module.exports = generateToken;