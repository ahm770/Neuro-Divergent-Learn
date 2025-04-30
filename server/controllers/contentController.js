// ===== File: /controllers/contentController.js =====
const axios = require('axios');
const Content = require('../models/Content'); // Make sure Content model is imported

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// --- Existing simplifyContent function ---
exports.simplifyContent = async (req, res) => {
  try {
    // Check if user is authenticated (will be added via middleware)
    // const userId = req.user._id; // Example if needed later

    const { topic, level = 'easy' } = req.body;

    // Find existing content first
    let content = await Content.findOne({ topic: topic.toLowerCase() }); // Standardize topic lookup
    if (!content) {
      // Optionally: If content doesn't exist, maybe try to fetch/create it?
      // For now, assume content must exist (e.g., added by an admin)
      return res.status(404).json({ error: `Content for topic "${topic}" not found.` });
    }

    // Check if this simplified version already exists
    const existingSimplified = content.simplifiedVersions.find(v => v.level === level);
    if (existingSimplified) {
       console.log(`Returning cached simplified version for topic: ${topic}, level: ${level}`);
       return res.json({ simplifiedText: existingSimplified.text });
    }

    console.log(`Generating new simplified version for topic: ${topic}, level: ${level}`);
    const prompt = `Simplify the following educational text about "${topic}" for a ${level} understanding. Focus on clarity and key concepts:\n\n${content.originalText}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct:free', // Corrected model name convention if needed
        messages: [
          { role: 'system', content: 'You are an expert tutor who simplifies educational text clearly and concisely.' },
          { role: 'user', content: prompt }
        ]
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

    const simplifiedText = response.data.choices[0].message.content.trim();

    // Add simplified version to array
    content.simplifiedVersions.push({
      level,
      text: simplifiedText
    });

    await content.save();

    res.json({ simplifiedText });

  } catch (err) {
    console.error("Error in simplifyContent:", err.response ? err.response.data : err.message); // Log more details
    res.status(500).json({ error: err.message || 'Failed to simplify content' });
  }
};

// --- NEW: Function to get content by topic ---
exports.getContentByTopic = async (req, res) => {
    try {
        const topic = req.params.topic.toLowerCase(); // Standardize topic lookup
        const content = await Content.findOne({ topic: topic });

        if (!content) {
            return res.status(404).json({ message: 'Content not found for this topic.' });
        }

        // Optionally: decide which simplified version to send by default,
        // or let the frontend request a specific one via simplifyContent.
        // Here, we send the whole content object including original and all cached versions.
        res.json(content);

    } catch (err) {
        console.error("Error fetching content:", err.message);
        res.status(500).json({ error: 'Failed to retrieve content' });
    }
};