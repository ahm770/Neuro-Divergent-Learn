// ===== File: /routes/qaRoutes.js =====
const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');
const { protect } = require('../middleware/authMiddleware'); // Import middleware

// POST a question - Requires user to be logged in
router.post('/ask', protect, qaController.askQuestion);

module.exports = router;