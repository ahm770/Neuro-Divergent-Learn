// ===== File: /server/routes/contentRoutes.js =====
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect, isAdmin } = require('../middleware/authMiddleware'); // Import isAdmin

// --- Routes for general users (protected) ---
router.get('/', protect, contentController.getAllContent);
router.get('/topic/:topic', protect, contentController.getContentByTopic);
router.post('/simplify', protect, contentController.simplifyContent);
router.post('/visual-map', protect, contentController.generateVisualMap);
// Add routes for audio/video generation/sourcing for users later if needed

// --- CRUD Routes for Content (Protected and Admin Only) ---
router.post('/create', protect, isAdmin, contentController.createContent);
router.get('/:id', protect, isAdmin, contentController.getContentById); // Admin can get by ID for management
router.put('/:id', protect, isAdmin, contentController.updateContent);
router.delete('/:id', protect, isAdmin, contentController.deleteContent);

// --- NEW: Routes for Audio/Video (Admin-focused initially) ---
router.post('/generate-audio', protect, isAdmin, contentController.generateAudioNarration);
router.post('/find-videos', protect, isAdmin, contentController.findVideoExplainers);


module.exports = router;