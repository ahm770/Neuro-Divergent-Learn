const mongoose = require('mongoose');

const simplifiedSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['easy', 'moderate', 'visual'],
    default: 'easy'
  },
  text: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const contentSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    unique: true
  },
  originalText: {
    type: String,
    required: true
  },
  simplifiedVersions: [simplifiedSchema],
  tags: [String],
  media: {
    imageUrls: [String],
    videoUrls: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Content', contentSchema);
