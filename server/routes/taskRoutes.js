// ===== File: /routes/taskRoutes.js =====
const express = require('express');
const router = express.Router();
const {
    createTask,
    getUserTasks,
    getTaskById,
    updateTask,
    deleteTask,
    taskValidation,
    getLearningProgressForContent, // Added
    getRecentLearningActivity,   // Added
    logContentInteraction        // Added
} = require('../controllers/taskController'); // taskController now holds these too
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All task routes are protected

// Task Management
router.post('/', taskValidation, createTask);
router.get('/', getUserTasks);
router.get('/:id', getTaskById);
router.put('/:id', taskValidation, updateTask);
router.delete('/:id', deleteTask);

// Learning Progress & Interaction Logging (could be in a separate progressRoutes.js too)
router.get('/progress/content/:contentId', getLearningProgressForContent);
router.get('/progress/recent', getRecentLearningActivity);
router.post('/progress/log-interaction', logContentInteraction);


module.exports = router;