const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator'); // For input validation

// Validation rules (can be moved to a separate validation file later)
const { body } = require('express-validator');

exports.signupValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').exists().withMessage('Password is required')
];


exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message || 'Server error during signup' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: user.preferences,
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || 'Server error during login' });
  }
};

// Get current logged-in user's profile
exports.getMe = async (req, res) => {
    try {
        // req.user is populated by the 'protect' middleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            preferences: user.preferences,
            createdAt: user.createdAt
        });
    } catch (err) {
        console.error("GetMe error:", err);
        res.status(500).json({ error: 'Server error fetching user profile' });
    }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { readingLevel, fontSize, theme, preferredContentMode, ttsEnabled } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate and update preferences
        if (readingLevel && ['basic', 'intermediate', 'advanced'].includes(readingLevel)) {
            user.preferences.readingLevel = readingLevel;
        }
        if (fontSize && ['small', 'medium', 'large', 'xlarge'].includes(fontSize)) {
            user.preferences.fontSize = fontSize;
        }
        if (theme && ['light', 'dark', 'high-contrast'].includes(theme)) {
            user.preferences.theme = theme;
        }
        if (preferredContentMode && ['text', 'video', 'visual', 'audio'].includes(preferredContentMode)) {
            user.preferences.preferredContentMode = preferredContentMode;
        }
        if (typeof ttsEnabled === 'boolean') {
            user.preferences.ttsEnabled = ttsEnabled;
        }

        await user.save();
        res.json({
            message: 'Preferences updated successfully',
            preferences: user.preferences
        });

    } catch (err) {
        console.error("UpdatePreferences error:", err);
        res.status(500).json({ error: 'Server error updating preferences' });
    }
};