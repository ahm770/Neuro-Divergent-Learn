// ===== File: /routes/lessonRoutes.js =====
const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { protect, isCreatorOrAdmin } = require('../middleware/authMiddleware');

// Create a new lesson (implicitly links to module passed in body)
router.post('/', protect, isCreatorOrAdmin, lessonController.lessonCreateValidation, lessonController.createLesson);

// Get all lessons for a specific module
router.get('/byModule/:moduleId', protect, lessonController.getLessonsByModule);

// Get a specific lesson by its ID
router.get('/:id', protect, lessonController.getLessonById);

// Update a lesson
router.put('/:id', protect, isCreatorOrAdmin, lessonController.lessonCreateValidation, lessonController.updateLesson); // Auth inside controller

// Delete a lesson
router.delete('/:id', protect, isCreatorOrAdmin, lessonController.deleteLesson); // Auth inside controller

// --- Lesson Item Management ---
router.post('/:lessonId/items/add', protect, isCreatorOrAdmin, lessonController.lessonItemValidation, lessonController.addItemToLesson);
router.delete('/:lessonId/items/remove', protect, isCreatorOrAdmin, lessonController.removeItemFromLesson); // itemId and itemType in body
router.put('/:lessonId/items/reorder', protect, isCreatorOrAdmin, lessonController.updateLessonItemsOrder);


module.exports = router;