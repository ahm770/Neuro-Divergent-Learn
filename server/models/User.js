// ===== File: /models/User.js =====
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['user', 'creator', 'admin'], // Added 'creator'
    default: 'user'
  },

  preferences: {
    readingLevel: { type: String, default: 'basic', enum: ['basic', 'intermediate', 'advanced'] },
    fontSize: { type: String, default: 'medium', enum: ['small', 'medium', 'large', 'xlarge'] },
    theme: { type: String, default: 'light', enum: ['light', 'dark', 'high-contrast'] },
    dyslexiaFontEnabled: { type: Boolean, default: false },
    preferredContentMode: { type: String, default: 'text', enum: ['text', 'video', 'visual', 'audio']},
    ttsEnabled: { type: Boolean, default: false }
  },

  createdAt: { type: Date, default: Date.now }
});

// ... rest of the User model (pre-save hook, matchPassword method) ...
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);