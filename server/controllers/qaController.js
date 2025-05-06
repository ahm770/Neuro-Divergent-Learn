// ===== File: /controllers/qaController.js =====
const axios = require('axios');
const Session = require('../models/Session');
const Content = require('../models/Content');
const User = require('../models/User'); // To get user preferences

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL || 'mistralai/mistral-7b-instruct:free';
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || 'http://localhost:3000';
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME || 'AccessibleLearningPortal';

// Helper to map user reading level to simplification level for context
const mapReadingLevelToSimplifyLevel = (readingLevel) => {
  switch (readingLevel) {
    case 'basic': return 'easy';
    case 'intermediate': case 'advanced': return 'moderate';
    default: return 'easy';
  }
};

exports.askQuestion = async (req, res) => {
  try {
    const { question, topic } = req.body;
    const userId = req.user._id;

    if (!question || !topic) {
      return res.status(400).json({ error: 'Question and topic are required.' });
    }

    const user = await User.findById(userId).select('preferences');
    const userReadingLevel = user?.preferences?.readingLevel || 'basic';
    const preferredSimplifyLevel = mapReadingLevelToSimplifyLevel(userReadingLevel);

    // 1. Fetch context based on the topic
    const content = await Content.findOne({ topic: topic.toLowerCase().trim() });
    let contextText = "General knowledge.";
    let contextUsed = 'general_knowledge';

    if (content) {
        // Prioritize using a simplified version matching user's preference if available
        const preferredSimplifiedVersion = content.simplifiedVersions.find(v => v.level === preferredSimplifyLevel);
        if (preferredSimplifiedVersion) {
            contextText = preferredSimplifiedVersion.text;
            contextUsed = `simplified_${preferredSimplifyLevel}`;
        } else {
            // Fallback to any 'easy' simplified version if preferred not found
            const easyVersion = content.simplifiedVersions.find(v => v.level === 'easy');
            if (easyVersion) {
                contextText = easyVersion.text;
                contextUsed = 'simplified_easy';
            } else {
                contextText = content.originalText; // Fallback to original if no suitable simplified version
                contextUsed = 'original';
            }
        }
    } else {
         console.warn(`Content not found for topic "${topic}" in QA, using general context.`);
    }

    // 2. Construct prompt for LLM, incorporating user preference for clarity
    let promptIntro = `You are a friendly, patient, and helpful tutor for a neurodivergent student. The student prefers explanations that are very clear, simple, and tailored for a '${userReadingLevel}' reading level.`;
    if (user?.preferences?.preferredContentMode === 'visual') {
        promptIntro += " The student sometimes benefits from analogies or visualizable descriptions if appropriate for the question."
    }

    const prompt = `${promptIntro}
Context on the topic "${topic}":
---
${contextText.substring(0, 2500)}
---
Based *primarily* on the provided context, answer the student's question. If the context is insufficient, you may use your general knowledge but state that you are doing so. If the question is completely outside the context and your general knowledge, clearly say you don't have the information.
Student's Question: "${question}"
Answer:`;

    // 3. Call OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_DEFAULT_MODEL,
        messages: [
          // System message sets the persona more broadly
          { role: 'system', content: `You are a friendly, patient, and helpful tutor for a neurodivergent student who needs clear and simple explanations. Adapt your language complexity to a '${userReadingLevel}' reading level.` },
          { role: 'user', content: prompt }
        ],
        // max_tokens: 200 // Optionally limit response length
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': YOUR_SITE_URL,
          'X-Title': YOUR_SITE_NAME
        }
      }
    );

    if (!response.data || !response.data.choices || response.data.choices.length === 0 || !response.data.choices[0].message) {
        console.error("Invalid response structure from OpenRouter API:", response.data);
        throw new Error('Invalid response structure from OpenRouter API');
    }

    const answer = response.data.choices[0].message.content.trim();

    // 4. Log interaction
    await Session.findOneAndUpdate(
        { userId: userId },
        {
            $push: {
                interactions: {
                    question: question,
                    answer: answer,
                    topic: topic,
                    contextUsed: contextUsed // Log which context was used
                }
            },
            $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true, new: true }
    );

    res.json({ answer });

  } catch (err) {
    console.error("Error in askQuestion:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to get answer' });
  }
};