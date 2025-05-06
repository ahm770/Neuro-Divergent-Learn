const express = require('express');
const router = express.Router();
const { signup, login, getMe, updatePreferences, signupValidation, loginValidation } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe); // New route to get current user profile
router.put('/preferences', protect, updatePreferences); // New route to update preferences

module.exports = router;