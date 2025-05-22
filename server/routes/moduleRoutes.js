// ===== File: /routes/moduleRoutes.js =====
const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { protect, isCreatorOrAdmin } = require('../middleware/authMiddleware');

// Create a new module (implicitly links to course passed in body, or could be /courses/:courseId/modules)
router.post('/', protect, isCreatorOrAdmin, moduleController.moduleCreateValidation, moduleController.createModule);

// Get all modules for a specific course
router.get('/byCourse/:courseId', protect, moduleController.getModulesByCourse);

// Get a specific module by its ID
router.get('/:id', protect, moduleController.getModuleById);

// Update a module
router.put('/:id', protect, isCreatorOrAdmin, moduleController.moduleCreateValidation, moduleController.updateModule); // Auth inside controller

// Delete a module
router.delete('/:id', protect, isCreatorOrAdmin, moduleController.deleteModule); // Auth inside controller

// --- Lesson Management within a Module ---
router.post('/:moduleId/lessons/add', protect, isCreatorOrAdmin, moduleController.addLessonToModule); // Auth inside controller
router.put('/:moduleId/lessons/reorder', protect, isCreatorOrAdmin, moduleController.updateLessonsOrderInModule); // Auth inside controller

module.exports = router;