// ===== File: /models/UserLearningProgress.js =====
const mongoose = require('mongoose');

const modeUsageSchema = new mongoose.Schema({
    mode: { type: String, required: true }, // e.g., 'original', 'simplified_easy', 'simplified_moderate', 'visual_mermaid', 'audio'
    count: { type: Number, default: 0 },
    totalTimeSpentMs: { type: Number, default: 0 }
}, { _id: false });

const userLearningProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'bookmarked'],
    default: 'not_started'
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  timeSpentTotalMs: { // Total time spent on this content across all sessions/modes
    type: Number,
    default: 0
  },
  modesUsedFrequency: [modeUsageSchema], // Tracks how often and for how long each mode is used for this content
  // For future micro-assessments:
  // quizScores: [{
  //   quizId: String, // Could be an ObjectId if quizzes become separate models
  //   score: Number,
  //   attempts: Number,
  //   lastAttempted: Date
  // }],
  notes: String, // User's personal notes on this content topic
  currentInteractionData: { // Data from client-side tracking for the current interaction with content
    mode: String,
    startTime: Date,
  }
}, { timestamps: true }); // Adds createdAt and updatedAt

// Compound index for efficient querying
userLearningProgressSchema.index({ userId: 1, contentId: 1 }, { unique: true });
userLearningProgressSchema.index({ userId: 1, status: 1 });
userLearningProgressSchema.index({ userId: 1, lastAccessed: -1 });


userLearningProgressSchema.statics.logInteractionStart = async function(userId, contentId, mode) {
    return this.findOneAndUpdate(
        { userId, contentId },
        {
            $set: {
                status: 'in_progress',
                lastAccessed: new Date(),
                'currentInteractionData.mode': mode,
                'currentInteractionData.startTime': new Date()
            }
        },
        { upsert: true, new: true }
    );
};

userLearningProgressSchema.statics.logInteractionEnd = async function(userId, contentId, durationMs) {
    const progress = await this.findOne({ userId, contentId });
    if (!progress || !progress.currentInteractionData || !progress.currentInteractionData.mode || !progress.currentInteractionData.startTime) {
        // console.warn(`No active interaction found for user ${userId} on content ${contentId} to log end.`);
        // If no start, maybe just update total time if duration is significant
        if (durationMs > 1000) { // only log if more than a second
             await this.findOneAndUpdate(
                { userId, contentId },
                {
                    $inc: { timeSpentTotalMs: durationMs },
                    $set: { lastAccessed: new Date(), status: 'in_progress' } // ensure status is in_progress
                },
                { upsert: true }
            );
        }
        return null;
    }

    const mode = progress.currentInteractionData.mode;
    // const startTime = progress.currentInteractionData.startTime;
    // const actualDurationMs = new Date().getTime() - startTime.getTime(); // Can use this or client-provided

    const updateQuery = {
        $inc: {
            timeSpentTotalMs: durationMs,
        },
        $set: {
            lastAccessed: new Date(),
            currentInteractionData: {} // Clear current interaction
        }
    };

    // Update modesUsedFrequency
    const modeUsageIndex = progress.modesUsedFrequency.findIndex(m => m.mode === mode);
    if (modeUsageIndex > -1) {
        updateQuery.$inc[`modesUsedFrequency.${modeUsageIndex}.count`] = 1;
        updateQuery.$inc[`modesUsedFrequency.${modeUsageIndex}.totalTimeSpentMs`] = durationMs;
    } else {
        updateQuery.$push = {
            modesUsedFrequency: { mode, count: 1, totalTimeSpentMs: durationMs }
        };
    }

    return this.findOneAndUpdate(
        { userId, contentId },
        updateQuery,
        { new: true }
    );
};


module.exports = mongoose.model('UserLearningProgress', userLearningProgressSchema);