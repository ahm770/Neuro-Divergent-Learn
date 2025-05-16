// ===== File: /routes/userRoutes.js =====
const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUserRole, deleteUserCtrl } = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All user management routes are admin-only
router.use(protect);
router.use(isAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/role', updateUserRole); // Specific endpoint for updating role
router.delete('/:id', deleteUserCtrl);

module.exports = router;