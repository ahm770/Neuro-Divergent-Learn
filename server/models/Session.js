// ===== File: /models/Session.js =====
const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  question: String,
  answer: String,
  topic: String, // Existing
  contextUsed: String, // Existing e.g., 'original', 'simplified_easy', 'general_knowledge'
  modeUsed: String, // NEW: e.g., 'qa', 'simplification_request', 'visual_map_request'
  durationMs: Number, // NEW: Time spent on this specific interaction if applicable
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interactions: [interactionSchema], // Updated schema for interactions
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now } // NEW: To track active sessions
});

// Update lastActivityAt on modification of interactions
sessionSchema.pre('findOneAndUpdate', function(next) {
  if (this.getUpdate().$push && this.getUpdate().$push.interactions) {
    this.getUpdate().lastActivityAt = new Date();
  }
  next();
});


module.exports = mongoose.model('Session', sessionSchema);