const mongoose = require('mongoose');

const simplifiedSchema = new mongoose.Schema({
  level: { // 'easy', 'moderate' correspond to user reading levels
    type: String,
    enum: ['easy', 'moderate', 'advanced'], // 'visual' mode is handled differently
    required: true
  },
  text: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// Schema for visual map data (could be JSON, Mermaid syntax, etc.)
const visualMapSchema = new mongoose.Schema({
  format: { type: String, enum: ['mermaid', 'json_graph', 'text_outline'], default: 'text_outline' },
  data: { type: String, required: true }, // Stores the actual visual data string
  notes: String, // Optional notes about the visual map
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
  // For 'text summary' and 'dyslexia-friendly font' (applied on frontend)
  simplifiedVersions: [simplifiedSchema],
  // For 'visual map (concept maps)'
  visualMaps: [visualMapSchema],
  // For 'audio narration' (could be URL to generated TTS or uploaded file)
  audioNarrations: [
    {
      language: { type: String, default: 'en-US' },
      voice: { type: String, default: 'default' }, // Could specify voice model later
      url: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  // For 'video explainer (auto-generated or sourced)'
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
  // This 'media' field might become redundant or used for other generic media
  // if specific types like audio/video are handled above.
  // For now, let's keep it for images or general files.
  media: {
    imageUrls: [String],
    // videoUrls: [String], // Moved to videoExplainers for more structure
  },
  createdBy: { // User who originally created/uploaded this content
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true // Make required if all content must be admin-added
  },
  lastUpdatedBy: { // User who last modified this content
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

// Update `updatedAt` timestamp before saving
contentSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Content', contentSchema);