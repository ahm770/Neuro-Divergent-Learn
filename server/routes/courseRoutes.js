// ===== File: /routes/courseRoutes.js =====
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, isCreatorOrAdmin, isAdmin } = require('../middleware/authMiddleware');

// --- Course CRUD & Management (Admin/Creator/Instructor) ---
router.post('/', protect, isCreatorOrAdmin, courseController.courseCreateValidation, courseController.createCourse);
router.get('/', protect, courseController.getAllCourses); // Public view filtered, admin/creator see all
router.get('/identifier/:identifier', protect, courseController.getCourseByIdOrSlug); // Use "identifier" to fetch by ID or slug
router.put('/:id', protect, isCreatorOrAdmin, courseController.courseCreateValidation, courseController.updateCourse); // Auth inside controller
router.delete('/:id', protect, isAdmin, courseController.deleteCourse); // Stricter delete permission

// --- Student Enrollment ---
router.post('/:id/enroll', protect, courseController.enrollInCourse);
router.delete('/:id/unenroll', protect, courseController.unenrollFromCourse);
router.get('/me/enrolled', protect, courseController.getEnrolledCourses);


// --- Module Management within a Course (Admin/Creator/Instructor) ---
// These could also be nested: router.post('/:courseId/modules', ...)
router.post('/:courseId/modules/add', protect, isCreatorOrAdmin, courseController.addModuleToCourse); // Auth inside controller for instructor check
router.put('/:courseId/modules/reorder', protect, isCreatorOrAdmin, courseController.updateModulesOrderInCourse); // Auth inside controller

module.exports = router;