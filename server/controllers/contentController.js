// ===== File: /controllers/contentController.js =====
const axios = require('axios');
const Content = require('../models/Content');
const User = require('../models/User'); // Needed for user preferences

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL || 'mistralai/mistral-7b-instruct:free';
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || 'http://localhost:3000'; // Default if not set
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME || 'AccessibleLearningPortal'; // Default if not set


// --- Helper to map user reading level to simplification level ---
const mapReadingLevelToSimplifyLevel = (readingLevel) => {
  switch (readingLevel) {
    case 'basic':
      return 'easy';
    case 'intermediate':
    case 'advanced': // For now, group intermediate and advanced to 'moderate'
      return 'moderate';
    default:
      return 'easy'; // Default simplification level
  }
};

// --- NEW: CRUD Operations for Content (Example: Admin/Instructor role) ---

// CREATE Content (Protected, e.g., for admins/instructors)
exports.createContent = async (req, res) => {
  try {
    const { topic, originalText, tags, imageUrls, videoExplainers, audioNarrations } = req.body;

    if (!topic || !originalText) {
      return res.status(400).json({ error: 'Topic and originalText are required.' });
    }

    const existingContent = await Content.findOne({ topic: topic.toLowerCase().trim() });
    if (existingContent) {
      return res.status(400).json({ error: `Content for topic "${topic}" already exists.` });
    }

    const newContent = new Content({
      topic: topic.toLowerCase().trim(),
      originalText,
      tags: tags || [],
      media: { imageUrls: imageUrls || [] },
      videoExplainers: videoExplainers || [],
      audioNarrations: audioNarrations || [],
      createdBy: req.user._id // Assumes 'protect' middleware adds user
    });

    await newContent.save();
    res.status(201).json(newContent);

  } catch (err) {
    console.error("Error creating content:", err.message);
    res.status(500).json({ error: 'Failed to create content' });
  }
};

// READ All Content (Paginated, perhaps) - Basic version for now
exports.getAllContent = async (req, res) => {
  try {
    const contents = await Content.find().select('topic tags createdAt').sort({ createdAt: -1 }); // Send limited info
    res.json(contents);
  } catch (err) {
    console.error("Error fetching all content:", err.message);
    res.status(500).json({ error: 'Failed to retrieve content list' });
  }
};

// READ Content by ID (more specific than by topic if needed)
exports.getContentById = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id).populate('createdBy', 'name email');
        if (!content) {
            return res.status(404).json({ message: 'Content not found.' });
        }
        res.json(content);
    } catch (err) {
        console.error("Error fetching content by ID:", err.message);
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid content ID format.' });
        }
        res.status(500).json({ error: 'Failed to retrieve content' });
    }
};


// UPDATE Content (Protected)
exports.updateContent = async (req, res) => {
  try {
    const { topic, originalText, tags, imageUrls, videoExplainers, audioNarrations, simplifiedVersions, visualMaps } = req.body;
    const contentId = req.params.id;

    let content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    // Optionally, check if user is creator or admin before allowing update
    // if (content.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'User not authorized to update this content.' });
    // }

    if (topic) content.topic = topic.toLowerCase().trim();
    if (originalText) content.originalText = originalText;
    if (tags) content.tags = tags;
    if (imageUrls) content.media.imageUrls = imageUrls;
    if (videoExplainers) content.videoExplainers = videoExplainers;
    if (audioNarrations) content.audioNarrations = audioNarrations;
    if (simplifiedVersions) content.simplifiedVersions = simplifiedVersions; // Allows direct update of simplified cache
    if (visualMaps) content.visualMaps = visualMaps; // Allows direct update of visual maps

    content.lastUpdatedBy = req.user._id;
    content.updatedAt = Date.now();

    const updatedContent = await content.save();
    res.json(updatedContent);

  } catch (err) {
    console.error("Error updating content:", err.message);
    if (err.kind === 'ObjectId') {
         return res.status(400).json({ message: 'Invalid content ID format.' });
    }
    res.status(500).json({ error: 'Failed to update content' });
  }
};

// DELETE Content (Protected)
exports.deleteContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    // Optionally, check if user is creator or admin
    // if (content.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'User not authorized to delete this content.' });
    // }

    await content.deleteOne(); // Mongoose 6+ uses deleteOne()
    res.json({ message: 'Content removed successfully.' });

  } catch (err) {
    console.error("Error deleting content:", err.message);
    if (err.kind === 'ObjectId') {
         return res.status(400).json({ message: 'Invalid content ID format.' });
    }
    res.status(500).json({ error: 'Failed to delete content' });
  }
};


// --- Function to get content by topic (for student consumption) ---
exports.getContentByTopic = async (req, res) => {
    try {
        const topic = req.params.topic.toLowerCase().trim();
        // Fetch user preferences if available to select preferred simplified version later
        const user = req.user ? await User.findById(req.user.id).select('preferences') : null;

        const content = await Content.findOne({ topic: topic }).populate('createdBy', 'name');

        if (!content) {
            return res.status(404).json({ message: `Content not found for topic: ${topic}` });
        }

        // Prepare response. Frontend can then choose which part to display.
        // Here we could intelligently select a default simplified version based on user prefs.
        let responseContent = { ...content.toObject() }; // Make a mutable copy

        if (user && user.preferences && user.preferences.readingLevel) {
            const preferredLevel = mapReadingLevelToSimplifyLevel(user.preferences.readingLevel);
            const preferredSimplifiedVersion = content.simplifiedVersions.find(v => v.level === preferredLevel);
            if (preferredSimplifiedVersion) {
                responseContent.defaultSimplifiedText = preferredSimplifiedVersion.text;
                responseContent.defaultSimplifiedLevel = preferredSimplifiedVersion.level;
            }
        }

        res.json(responseContent);

    } catch (err) {
        console.error("Error fetching content by topic:", err.message);
        res.status(500).json({ error: 'Failed to retrieve content' });
    }
};


// --- Content Mode Switching: Text Simplification ---
exports.simplifyContent = async (req, res) => {
  try {
    const userId = req.user._id; // From 'protect' middleware
    const user = await User.findById(userId).select('preferences'); // Get user preferences

    const { topic } = req.body;
    let { level } = req.body; // Requested level e.g. 'easy', 'moderate'

    if (!topic) {
        return res.status(400).json({ error: "Topic is required for simplification." });
    }

    // If no level is specified in request, use user's preferred reading level
    if (!level && user && user.preferences && user.preferences.readingLevel) {
      level = mapReadingLevelToSimplifyLevel(user.preferences.readingLevel);
    } else if (!level) {
      level = 'easy'; // Fallback to 'easy' if no user preference or request param
    }

    if (!['easy', 'moderate'].includes(level)) {
        return res.status(400).json({ error: "Invalid simplification level. Choose 'easy' or 'moderate'." });
    }

    let contentDoc = await Content.findOne({ topic: topic.toLowerCase().trim() });
    if (!contentDoc) {
      return res.status(404).json({ error: `Content for topic "${topic}" not found.` });
    }

    const existingSimplified = contentDoc.simplifiedVersions.find(v => v.level === level);
    if (existingSimplified) {
       console.log(`Returning cached simplified version for topic: ${topic}, level: ${level}`);
       return res.json({ simplifiedText: existingSimplified.text, level: existingSimplified.level });
    }

    console.log(`Generating new simplified version for topic: ${topic}, level: ${level}`);
    const prompt = `Simplify the following educational text about "${contentDoc.topic}" for a student who needs an "${level}" level of understanding. Focus on very clear language, short sentences, and key concepts. Original text:\n\n${contentDoc.originalText}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert tutor who simplifies educational text clearly and concisely for neurodivergent students.' },
          { role: 'user', content: prompt }
        ],
        // max_tokens: 500 // Optional: Adjust based on expected length
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

    const simplifiedText = response.data.choices[0].message.content.trim();

    contentDoc.simplifiedVersions.push({ level, text: simplifiedText });
    await contentDoc.save();

    res.json({ simplifiedText, level });

  } catch (err) {
    console.error("Error in simplifyContent:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to simplify content' });
  }
};

// ... (other parts of contentController.js)

// --- Content Mode Switching: Generate Visual Map (Potentially Mermaid) ---
exports.generateVisualMap = async (req, res) => {
  try {
      const { topic, format = 'text_outline' } = req.body; // Allow requesting format, default to text_outline
      // const userId = req.user._id;

      if (!topic) {
          return res.status(400).json({ error: "Topic is required for visual map generation." });
      }
      if (!['text_outline', 'mermaid'].includes(format)) {
          return res.status(400).json({ error: "Invalid visual map format. Supported: 'text_outline', 'mermaid'." });
      }

      let contentDoc = await Content.findOne({ topic: topic.toLowerCase().trim() });
      if (!contentDoc) {
          return res.status(404).json({ error: `Content for topic "${topic}" not found.` });
      }

      const existingMap = contentDoc.visualMaps.find(v => v.format === format);
      if (existingMap) {
          console.log(`Returning cached visual map (format: ${format}) for topic: ${topic}`);
          return res.json({ visualMap: existingMap });
      }

      console.log(`Generating new visual map (format: ${format}) for topic: ${topic}`);
      
      let prompt;
      let systemMessage = 'You are an AI that structures educational content for visualization.';

      if (format === 'mermaid') {
          systemMessage = 'You are an AI that generates MermaidJS syntax for mind maps or flowcharts from educational text. Use graph TD or mindmap syntax where appropriate.';
          prompt = `Generate MermaidJS syntax for a mind map or concept map representing the key concepts and their relationships from the following text about "${contentDoc.topic}".
Focus on clarity and simplicity. Use graph TD or mindmap syntax. Ensure the output is only valid Mermaid code.
Original text (excerpt):
---
${contentDoc.originalText.substring(0, 2000)}
---
Mermaid Code:`;
      } else { // text_outline
          prompt = `Create a structured text outline or list of key concepts and sub-concepts for the educational topic "${contentDoc.topic}". This will be used to help visualize the topic. Focus on hierarchical relationships. Original text:\n\n${contentDoc.originalText.substring(0, 2000)}`;
      }

      const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
              model: OPENROUTER_DEFAULT_MODEL, // Consider more powerful models for Mermaid
              messages: [
                  { role: 'system', content: systemMessage },
                  { role: 'user', content: prompt }
              ],
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
          throw new Error('Invalid response structure from OpenRouter API for visual map');
      }

      let visualMapData = response.data.choices[0].message.content.trim();

      // Clean up potential "Mermaid Code:" prefix or backticks if LLM includes them
      if (format === 'mermaid') {
          visualMapData = visualMapData.replace(/^Mermaid Code:\s*/i, '');
          visualMapData = visualMapData.replace(/^```mermaid\s*\n?([\s\S]*?)\n?```$/, '$1').trim();
          visualMapData = visualMapData.replace(/^```\s*\n?([\s\S]*?)\n?```$/, '$1').trim(); // Generic backtick removal
      }


      const newVisualMap = {
          format: format,
          data: visualMapData,
          notes: `AI-generated ${format}.`
      };

      contentDoc.visualMaps.push(newVisualMap);
      contentDoc.lastUpdatedBy = req.user._id;
      await contentDoc.save();

      res.json({ visualMap: newVisualMap });

  } catch (err) {
      console.error("Error in generateVisualMap:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message, err.stack);
      res.status(500).json({ error: err.message || 'Failed to generate visual map' });
  }
};

exports.generateAudioNarration = async (req, res) => {
  const { contentId, textToNarrate, language = 'en-US', voice = 'default' } = req.body;
  // textToNarrate could be originalText, simplifiedText, or custom
  // In a real app, you'd pick simplifiedText or originalText from the contentId

  if (!contentId || !textToNarrate) {
      return res.status(400).json({ error: 'contentId and textToNarrate are required.' });
  }

  try {
      const contentDoc = await Content.findById(contentId);
      if (!contentDoc) {
          return res.status(404).json({ error: 'Content not found.' });
      }

      console.log(`Request to generate audio for contentId: ${contentId}, language: ${language}, voice: ${voice}`);
      // TODO: Integrate with a Text-to-Speech API (e.g., AWS Polly, Google Cloud TTS, ElevenLabs)
      // 1. Send `textToNarrate` to TTS API.
      // 2. Get back an audio file URL or raw audio data.
      // 3. If raw data, upload to a storage service (S3, Google Cloud Storage) to get a URL.
      // 4. Save the URL to the Content document.

      // --- Placeholder Logic ---
      const placeholderAudioUrl = `https://example.com/audio/${contentDoc.topic.replace(/\s+/g, '-')}-${Date.now()}.mp3`;
      const newNarration = {
          language,
          voice,
          url: placeholderAudioUrl,
          createdAt: new Date()
      };
      contentDoc.audioNarrations.push(newNarration);
      contentDoc.lastUpdatedBy = req.user._id;
      await contentDoc.save();
      // --- End Placeholder ---

      res.status(201).json({
          message: 'Audio narration generation initiated (placeholder).',
          narration: newNarration,
          content: contentDoc
      });

  } catch (err) {
      console.error("Error in generateAudioNarration:", err.message, err.stack);
      res.status(500).json({ error: 'Failed to generate audio narration.' });
  }
};

// --- NEW: Find Video Explainers (Placeholder for YouTube/Vimeo API Integration) ---
exports.findVideoExplainers = async (req, res) => {
  const { contentId, query } = req.body; // query could be contentDoc.topic

  if (!contentId || !query) {
      return res.status(400).json({ error: 'contentId and query (topic) are required.' });
  }
  
  try {
      const contentDoc = await Content.findById(contentId);
      if (!contentDoc) {
          return res.status(404).json({ error: 'Content not found.' });
      }

      console.log(`Request to find videos for query: ${query} (contentId: ${contentId})`);
      // TODO: Integrate with YouTube Data API or Vimeo API
      // 1. Use `query` to search for relevant videos.
      // 2. Present results to admin/user to select. (This part is tricky for a simple API call)
      // 3. For now, let's assume we found one and are adding it.

      // --- Placeholder Logic ---
      // Simulate finding a YouTube video
      const placeholderVideo = {
          source: 'youtube',
          url: `https://www.youtube.com/watch?v=example${Date.now().toString().slice(-5)}`,
          title: `Placeholder Video for ${query}`,
          description: `An AI-found video about ${query}.`,
          createdAt: new Date()
      };
      // Prevent duplicates if this is run multiple times
      const existingVideo = contentDoc.videoExplainers.find(v => v.url === placeholderVideo.url);
      if (!existingVideo) {
          contentDoc.videoExplainers.push(placeholderVideo);
          contentDoc.lastUpdatedBy = req.user._id;
          await contentDoc.save();
      }
      // --- End Placeholder ---

      res.json({
          message: 'Video search initiated (placeholder). Found videos added.',
          videosAdded: existingVideo ? 0 : 1,
          content: contentDoc
      });

  } catch (err) {
      console.error("Error in findVideoExplainers:", err.message, err.stack);
      res.status(500).json({ error: 'Failed to find video explainers.' });
  }
};