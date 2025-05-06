const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interactions: [
    {
      question: String,
      answer: String,
      topic: String, // Added topic field
      contextUsed: String, // e.g., 'original', 'simplified_easy', 'general_knowledge'
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);