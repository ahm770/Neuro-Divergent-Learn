// ===== File: /controllers/qaController.js =====
const axios = require('axios');
const Session = require('../models/Session');
const Content = require('../models/Content'); // Need Content model for context

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

exports.askQuestion = async (req, res) => {
  try {
    const { question, topic } = req.body; // Expect topic to provide context
    const userId = req.user._id; // Assumes auth middleware has run and attached user

    if (!question || !topic) {
      return res.status(400).json({ error: 'Question and topic are required.' });
    }

    // 1. Fetch context based on the topic
    const content = await Content.findOne({ topic: topic.toLowerCase() });
    let contextText = "General knowledge."; // Default context if topic not found
    if (content) {
        // Prioritize using a simplified version if available, otherwise original
        const simpleVersion = content.simplifiedVersions.find(v => v.level === 'easy'); // Or based on user preference later
        contextText = simpleVersion ? simpleVersion.text : content.originalText;
    } else {
         console.warn(`Content not found for topic "${topic}" in QA, using general context.`);
    }


    // 2. Construct prompt for LLM
    const prompt = `You are a friendly and helpful tutor for a neurodivergent student.
Context on the topic "${topic}":
---
${contextText.substring(0, 1500)}
---
Based *only* on the provided context or general knowledge if the context is insufficient, answer the student's question clearly and simply. If the question is outside the context or your general knowledge, say you don't know.
Student's Question: "${question}"
Answer:`;

    // 3. Call OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct:free', // Or another suitable model
        messages: [
          // System message sets the persona
          { role: 'system', content: 'You are a friendly and helpful tutor explaining concepts clearly and simply.' },
          { role: 'user', content: prompt }
        ],
        // max_tokens: 150 // Optionally limit response length
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.YOUR_SITE_URL, // Recommended by OpenRouter
          'X-Title': process.env.YOUR_SITE_NAME    // Recommended by OpenRouter
        }
      }
    );

    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new Error('Invalid response structure from OpenRouter API');
    }

    const answer = response.data.choices[0].message.content.trim();

    // 4. Log interaction (optional but recommended)
    await Session.findOneAndUpdate(
        { userId: userId },
        {
            $push: {
                interactions: {
                    question: question,
                    answer: answer,
                    topic: topic // Store topic for context
                }
            },
            $setOnInsert: { createdAt: new Date() } // Set createdAt only on insert
        },
        { upsert: true, new: true } // Create session if it doesn't exist
    );

    // 5. Send response
    res.json({ answer });

  } catch (err) {
    console.error("Error in askQuestion:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: err.message || 'Failed to get answer' });
  }
};