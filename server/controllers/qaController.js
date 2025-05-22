// ===== File: /controllers/qaController.js =====
const axios = require('axios');
const Session = require('../models/Session');
const Content = require('../models/Content');
const User = require('../models/User');
const mongoose = require('mongoose'); // For ObjectId validation

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL || 'mistralai/mistral-7b-instruct:free'; // or a better free/paid model
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || 'http://localhost:3000'; // Replace with your actual site URL
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME || 'AccessibleLearningPortal'; // Replace with your actual site name

const mapReadingLevelToSimplifyLevel = (readingLevel) => {
  switch (readingLevel?.toLowerCase()) {
    case 'eli5': return 'eli5';
    case 'basic': case 'easy': return 'easy';
    case 'intermediate': case 'moderate': return 'moderate';
    case 'advanced': return 'advanced';
    case 'high_school': return 'high_school';
    case 'college_intro': return 'college_intro';
    default: return 'easy';
  }
};

exports.askQuestion = async (req, res) => {
  try {
    const { question, topic, contentId } = req.body; // contentId is optional, topic is slug
    const userId = req.user._id;

    if (!question || !topic) {
      return res.status(400).json({ error: 'Question and topic (slug) are required.' });
    }
    if (contentId && !mongoose.Types.ObjectId.isValid(contentId)) {
        return res.status(400).json({ error: 'Invalid contentId format.' });
    }


    const user = await User.findById(userId).select('preferences');
    const userReadingLevel = user?.preferences?.readingLevel || 'basic'; // Default reading level
    // Use the new granular map for context fetching, if applicable
    const preferredSimplifyLevelForContext = mapReadingLevelToSimplifyLevel(userReadingLevel);

    let contentDoc;
    if (contentId) {
        contentDoc = await Content.findById(contentId);
    } else if (topic) { // Fallback to topic slug if no ID
        contentDoc = await Content.findOne({ topic: topic.toLowerCase().trim() });
    }

    let contextText = "General knowledge. The student is asking about a topic for which specific context was not found in the database.";
    let contextUsed = 'general_knowledge';

    if (contentDoc) {
        const preferredSimplifiedVersion = contentDoc.simplifiedVersions.find(v => v.level === preferredSimplifyLevelForContext);
        if (preferredSimplifiedVersion) {
            contextText = preferredSimplifiedVersion.text;
            contextUsed = `simplified_${preferredSimplifyLevelForContext}`;
        } else {
            // Fallback to any 'easy' or 'eli5' simplified version if preferred not found
            const easyVersion = contentDoc.simplifiedVersions.find(v => v.level === 'easy' || v.level === 'eli5');
            if (easyVersion) {
                contextText = easyVersion.text;
                contextUsed = `simplified_${easyVersion.level}`;
            } else {
                contextText = contentDoc.originalText; // Fallback to original
                contextUsed = 'original';
            }
        }
    } else {
         console.warn(`QA: Content not found for topic "${topic}" or ID "${contentId}", using general context.`);
    }

    // Fetch last 2-3 interactions for context
    const sessionData = await Session.findOne({ userId: userId }).sort({ 'interactions.timestamp': -1 });
    let previousInteractionsContext = "";
    if (sessionData && sessionData.interactions && sessionData.interactions.length > 0) {
        const relevantInteractions = sessionData.interactions
            .filter(inter => inter.topic === (contentDoc?.topic || topic)) // Filter by current topic slug
            .slice(-3); // Get last 3, adjust as needed
        if (relevantInteractions.length > 0) {
            previousInteractionsContext = "\nPrevious conversation on this topic:\n" +
                relevantInteractions.map(inter => `Student: ${inter.question || 'User performed an action.'}\nTutor: ${inter.answer || 'System responded.'}`).join("\n---\n") + // Handle non-question interactions gracefully
                "\n--- (End of previous conversation) ---\n";
        }
    }

    let promptIntro = `You are a friendly, patient, and helpful AI tutor for a neurodivergent student. The student's preferred reading level is '${userReadingLevel}'. Adapt your language complexity accordingly.`;
    if (user?.preferences?.preferredContentMode === 'visual') {
        promptIntro += " The student sometimes benefits from analogies or visualizable descriptions if appropriate for the question."
    }
    promptIntro += " If the student seems stuck, confused by your explanation, or asks multiple clarifying questions about the same small detail, proactively offer to explain it differently, provide an example, or break it down further. Your goal is to ensure understanding and build confidence."


    const prompt = `${promptIntro}
${previousInteractionsContext}
Current Topic Context ("${contentDoc?.topic.replace(/-/g,' ') || topic}"):
---
${contextText.substring(0, 3000)}
---
Based *primarily* on the provided context and recent conversation, answer the student's question. If the context is insufficient, you may use your general knowledge but state that you are doing so. If the question is completely outside the context and your general knowledge, clearly say you don't have the information or cannot help with that specific type of query.
Student's Current Question: "${question}"
AI Tutor's Answer:`;

    const startTime = Date.now();
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_DEFAULT_MODEL,
        messages: [
          { role: 'system', content: `You are an AI tutor for neurodivergent students. Be patient, clear, and adapt to a '${userReadingLevel}' reading level. Be proactive in offering alternative explanations if the student seems to struggle.` },
          { role: 'user', content: prompt }
        ],
        max_tokens: 350, // Adjust token limit as needed
        temperature: 0.5, // Adjust for creativity vs. factuality
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
    const durationMs = Date.now() - startTime;

    if (!response.data || !response.data.choices || response.data.choices.length === 0 || !response.data.choices[0].message) {
        console.error("Invalid response structure from OpenRouter API:", response.data);
        return res.status(502).json({ error: 'Received an invalid or empty response from the AI service.' });
    }

    const answer = response.data.choices[0].message.content.trim();

    await Session.findOneAndUpdate(
        { userId: userId },
        {
            $push: {
                interactions: {
                    question: question,
                    answer: answer,
                    topic: contentDoc?.topic || topic, // Use actual slug from content if available
                    contextUsed: contextUsed,
                    modeUsed: 'qa',
                    durationMs: durationMs,
                    timestamp: new Date()
                }
            },
            $set: { lastActivityAt: new Date() },
            $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true, new: true }
    );

    res.json({ answer });

  } catch (err) {
    console.error("Error in askQuestion:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message, err.stack);
    let statusCode = 500;
    let errorMessage = err.message || 'Failed to get answer from AI service.';
    if (err.response) {
        statusCode = err.response.status || 500;
        errorMessage = err.response.data?.error?.message || err.response.data?.error || errorMessage;
        if (statusCode === 401) errorMessage = "AI service authentication failed. Check API key.";
        if (statusCode === 429) errorMessage = "AI service rate limit exceeded. Please try again later.";
    }
    res.status(statusCode).json({ error: errorMessage });
  }
};