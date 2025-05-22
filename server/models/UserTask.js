// ===== File: /models/UserTask.js =====
const mongoose = require('mongoose');

const userTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  relatedContentId: { // Optional: link task to a specific content item
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  relatedContentTopic: String, // Store topic slug for easy display if content is linked
  dueDate: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  // For future Pomodoro integration:
  // pomodorosEstimated: Number,
  // pomodorosCompleted: { type: Number, default: 0 }
}, { timestamps: true }); // Adds createdAt and updatedAt

userTaskSchema.index({ userId: 1, completed: 1, dueDate: 1 });

userTaskSchema.pre('save', function(next) {
  if (this.isModified('completed') && this.completed && !this.completedAt) {
    this.completedAt = new Date();
  } else if (this.isModified('completed') && !this.completed) {
    this.completedAt = undefined;
  }
  next();
});

module.exports = mongoose.model('UserTask', userTaskSchema);