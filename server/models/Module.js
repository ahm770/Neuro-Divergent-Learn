// ===== File: /models/Module.js =====
const mongoose = require('mongoose');
const Lesson = require('./Lesson'); // Required for cascading delete

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  order: { // For sequencing within a course
    type: Number,
    required: true,
    default: 0,
  },
  lessons: [{ // Ordered list of Lesson ObjectIds
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
  }],
  published: {
    type: Boolean,
    default: false,
  },
  moduleLearningObjectives: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });


// Middleware for cascading delete of lessons when a module is removed
moduleSchema.pre('remove', async function(next) {
    try {
        // 'this' refers to the module document being removed
        await Lesson.deleteMany({ moduleId: this._id });
        // Note: This will trigger 'remove' hooks on Lesson schema if defined
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Module', moduleSchema);