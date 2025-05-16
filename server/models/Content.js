const mongoose = require('mongoose');

const simplifiedSchema = new mongoose.Schema({
  level: { 
    type: String,
    enum: ['easy', 'moderate', 'advanced'],
    required: true
  },
  text: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const visualMapSchema = new mongoose.Schema({
  format: { type: String, enum: ['mermaid', 'json_graph', 'text_outline'], default: 'text_outline' },
  data: { type: String, required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });


const contentSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  originalText: {
    type: String,
    required: true
  },
  simplifiedVersions: [simplifiedSchema],
  visualMaps: [visualMapSchema],
  audioNarrations: [
    {
      language: { type: String, default: 'en-US' },
      voice: { type: String, default: 'default' },
      url: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  videoExplainers: [
    {
      source: { type: String, enum: ['youtube', 'vimeo', 'custom_upload', 'generated'], default: 'youtube' },
      url: { type: String, required: true },
      title: String,
      description: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  tags: [String],
  media: {
    imageUrls: [String],
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastUpdatedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

contentSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Content', contentSchema);