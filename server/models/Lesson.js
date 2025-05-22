// ===== File: /models/Lesson.js =====
const mongoose = require('mongoose');

const lessonItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['Content', 'Quiz', 'Assignment', 'ExternalLink', 'Discussion'], // Add more as needed
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'items.itemType', // Dynamic ref based on itemType
  },
  titleOverride: { // Optional, to display a different title for this item in the lesson context
    type: String,
    trim: true,
  },
  order: {
      type: Number,
      required: true,
      default: 0
  }
}, { _id: false }); // No separate _id for subdocuments unless needed

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
    index: true,
  },
  order: { // For sequencing within a module
    type: Number,
    required: true,
    default: 0,
  },
  items: [lessonItemSchema], // Ordered list of items
  published: {
    type: Boolean,
    default: false,
  },
  estimatedCompletionTimeMinutes: {
    type: Number,
    min: 0,
  },
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

// No specific 'remove' hook for Lesson needed for now, as its items are references.
// If items were actual subdocuments that needed cleanup, a hook might be relevant.

module.exports = mongoose.model('Lesson', lessonSchema);