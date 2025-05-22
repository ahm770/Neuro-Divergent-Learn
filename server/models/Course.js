// ===== File: /models/Course.js =====
const mongoose = require('mongoose');
const Module = require('./Module'); // Required for cascading delete

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  instructorIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  studentIds: [{ // For enrollment
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  modules: [{ // Ordered list of Module ObjectIds
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
  }],
  published: {
    type: Boolean,
    default: false,
  },
  coverImage: {
    type: String, // URL to the image
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  globalLearningObjectives: [String],
  createdBy: { // Track who originally created the course
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

// Middleware to generate slug from title before saving
courseSchema.pre('validate', function(next) {
  if (this.title && (this.isModified('title') || this.isNew)) {
    this.slug = this.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  next();
});

// Ensure an instructor is added when createdBy is set
courseSchema.pre('save', function(next) {
    if (this.isNew && this.createdBy && !this.instructorIds.map(id => id.toString()).includes(this.createdBy.toString())) {
        this.instructorIds.push(this.createdBy);
    }
    if (this.isModified() && this.lastUpdatedBy) {
        // This timestamp is automatically handled by Mongoose {timestamps: true}
    }
    next();
});

// Middleware for cascading delete of modules when a course is removed
courseSchema.pre('remove', async function(next) {
    try {
        // 'this' refers to the course document being removed
        await Module.deleteMany({ courseId: this._id });
        // Note: This will trigger 'remove' hooks on Module schema if defined
        next();
    } catch (error) {
        next(error);
    }
});


module.exports = mongoose.model('Course', courseSchema);