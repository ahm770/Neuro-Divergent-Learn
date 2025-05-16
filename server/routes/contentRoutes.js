// ===== File: /server/routes/contentRoutes.js =====
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect, isAdmin, isCreatorOrAdmin } = require('../middleware/authMiddleware'); // Import isCreatorOrAdmin

// --- Routes for general users (protected) ---
router.get('/', protect, contentController.getAllContent); // For dashboard topic list
router.get('/topic/:topic', protect, contentController.getContentByTopic);
router.post('/simplify', protect, contentController.simplifyContent);
router.post('/visual-map', protect, contentController.generateVisualMap);
// Add routes for audio/video generation/sourcing for users later if needed

// --- CRUD Routes for Content (Protected, Creator or Admin) ---
router.post('/create', protect, isCreatorOrAdmin, contentController.createContent);
// Admin or Creator can get by ID for management/editing
router.get('/:id', protect, isCreatorOrAdmin, contentController.getContentById); 
router.put('/:id', protect, isCreatorOrAdmin, contentController.updateContent);
router.delete('/:id', protect, isCreatorOrAdmin, contentController.deleteContent);

// --- Routes for Audio/Video generation (Creator or Admin-focused initially) ---
router.post('/generate-audio', protect, isCreatorOrAdmin, contentController.generateAudioNarration);
router.post('/find-videos', protect, isCreatorOrAdmin, contentController.findVideoExplainers);


module.exports = router;