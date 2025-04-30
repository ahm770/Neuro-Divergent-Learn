// ===== File: /server/routes/contentRoutes.js =====
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect } = require('../middleware/authMiddleware'); // Don't forget to re-add middleware if needed!

// Use the correct function names from the controller
router.get('/:topic', protect, contentController.getContentByTopic); // Added protect back
router.post('/simplify', protect, contentController.simplifyContent); // Corrected: simplifyContent

module.exports = router;