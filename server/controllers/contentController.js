// ===== File: /server/controllers/contentController.js =====
const Content = require('../models/Content');
const User = require('../models/User');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
let genAI;
let textModel;

if (GOOGLE_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    console.log("Google Generative AI SDK initialized successfully with gemini-1.5-flash-latest.");
  } catch (error) {
    console.error("FATAL: Failed to initialize Google Generative AI SDK:", error.message);
  }
} else {
  console.warn("Warning: GOOGLE_API_KEY is not defined. Google AI features will be disabled.");
}

const mapReadingLevelToPromptDescription = (readingLevel) => {
  switch (readingLevel) {
    case 'basic': return 'an easy-to-understand';
    case 'intermediate': return 'a moderately detailed';
    case 'advanced': return 'an advanced and comprehensive';
    default: return 'an easy-to-understand';
  }
};
const mapReadingLevelToCacheKey = (readingLevel) => {
  switch (readingLevel) {
    case 'basic': return 'easy';
    case 'intermediate': return 'moderate';
    case 'advanced': return 'advanced';
    default: return 'easy';
  }
};

const createContent = async (req, res) => {
  try {
    const { topic, originalText, tags, imageUrls, videoExplainers, audioNarrations } = req.body;
    if (!topic || !originalText) {
      return res.status(400).json({ error: 'Topic and originalText are required.' });
    }
    const topicSlug = topic.toLowerCase().trim().replace(/\s+/g, '-');
    const existingContent = await Content.findOne({ topic: topicSlug });
    if (existingContent) {
      return res.status(400).json({ error: `Content for topic "${topic}" already exists (slug: ${topicSlug}).` });
    }
    const newContent = new Content({
      topic: topicSlug,
      originalText,
      tags: tags || [],
      media: { imageUrls: imageUrls || [] },
      videoExplainers: videoExplainers || [],
      audioNarrations: audioNarrations || [],
      createdBy: req.user?._id
    });
    await newContent.save();
    res.status(201).json(newContent);
  } catch (err) {
    console.error("Error creating content:", err.message, err.stack);
    res.status(500).json({ error: 'Failed to create content' });
  }
};

const getAllContent = async (req, res) => {
  try {
    const contents = await Content.find().select('topic tags createdAt').sort({ createdAt: -1 });
    res.json(contents);
  } catch (err) {
    console.error("Error fetching all content:", err.message, err.stack);
    res.status(500).json({ error: 'Failed to retrieve content list' });
  }
};

const getContentById = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id).populate('createdBy', 'name email');
        if (!content) {
            return res.status(404).json({ message: 'Content not found.' });
        }
        res.json(content);
    } catch (err) {
        console.error("Error fetching content by ID:", err.message, err.stack);
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid content ID format.' });
        }
        res.status(500).json({ error: 'Failed to retrieve content' });
    }
};

const updateContent = async (req, res) => {
  try {
    const { topic, originalText, tags, imageUrls, videoExplainers, audioNarrations, simplifiedVersions, visualMaps } = req.body;
    const contentId = req.params.id;
    let content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found.' });
    }
    if (topic) content.topic = topic.toLowerCase().trim().replace(/\s+/g, '-');
    if (originalText) content.originalText = originalText;
    if (tags !== undefined) content.tags = tags;
    if (imageUrls !== undefined) content.media.imageUrls = imageUrls;
    if (videoExplainers !== undefined) content.videoExplainers = videoExplainers;
    if (audioNarrations !== undefined) content.audioNarrations = audioNarrations;
    if (simplifiedVersions !== undefined) content.simplifiedVersions = simplifiedVersions;
    if (visualMaps !== undefined) content.visualMaps = visualMaps;
    content.lastUpdatedBy = req.user?._id;
    const updatedContent = await content.save();
    res.json(updatedContent);
  } catch (err) {
    console.error("Error updating content:", err.message, err.stack);
    if (err.kind === 'ObjectId') { return res.status(400).json({ message: 'Invalid content ID format.' }); }
    res.status(500).json({ error: 'Failed to update content' });
  }
};

const deleteContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    const content = await Content.findById(contentId);
    if (!content) { return res.status(404).json({ error: 'Content not found.' }); }
    await content.deleteOne();
    res.json({ message: 'Content removed successfully.' });
  } catch (err) {
    console.error("Error deleting content:", err.message, err.stack);
    if (err.kind === 'ObjectId') { return res.status(400).json({ message: 'Invalid content ID format.' });}
    res.status(500).json({ error: 'Failed to delete content' });
  }
};

const getContentByTopic = async (req, res) => {
    try {
        const topicSlug = req.params.topic.toLowerCase().trim();
        const user = req.user ? await User.findById(req.user.id).select('preferences') : null;
        const content = await Content.findOne({ topic: topicSlug }).populate('createdBy', 'name');
        if (!content) { return res.status(404).json({ message: `Content not found for topic: ${topicSlug}` });}
        let responseContent = { ...content.toObject() };
        if (user?.preferences?.readingLevel) {
            const cacheLevelKey = mapReadingLevelToCacheKey(user.preferences.readingLevel);
            const preferredSimplifiedVersion = content.simplifiedVersions.find(v => v.level === cacheLevelKey);
            if (preferredSimplifiedVersion) {
                responseContent.defaultSimplifiedText = preferredSimplifiedVersion.text;
                responseContent.defaultSimplifiedLevel = preferredSimplifiedVersion.level;
            }
        }
        res.json(responseContent);
    } catch (err) {
        console.error("Error fetching content by topic:", err.message, err.stack);
        res.status(500).json({ error: 'Failed to retrieve content' });
    }
};

const simplifyContent = async (req, res) => {
  if (!GOOGLE_API_KEY || !textModel) {
    console.error("Google AI SDK (textModel) not initialized for simplifyContent.");
    return res.status(500).json({ error: "AI service is not configured." });
  }
  try {
    const { topic: topicSlug } = req.body;
    let { level: clientRequestedLevel } = req.body;
    if (!topicSlug) { return res.status(400).json({ error: "Topic slug is required." }); }

    let promptLevelDescription;
    let cacheLevelKey;
    if (!clientRequestedLevel) {
      const userId = req.user?._id;
      let userReadingLevelPref = 'basic';
      if (userId) {
        const user = await User.findById(userId).select('preferences');
        if (user?.preferences?.readingLevel) userReadingLevelPref = user.preferences.readingLevel;
      }
      promptLevelDescription = mapReadingLevelToPromptDescription(userReadingLevelPref);
      cacheLevelKey = mapReadingLevelToCacheKey(userReadingLevelPref);
    } else {
      promptLevelDescription = mapReadingLevelToPromptDescription(clientRequestedLevel);
      cacheLevelKey = mapReadingLevelToCacheKey(clientRequestedLevel);
    }

    let contentDoc = await Content.findOne({ topic: topicSlug.toLowerCase().trim() });
    if (!contentDoc) { return res.status(404).json({ error: `Content for topic "${topicSlug}" not found.` });}

    const existingSimplified = contentDoc.simplifiedVersions.find(v => v.level === cacheLevelKey);
    if (existingSimplified) {
      return res.json({ simplifiedText: existingSimplified.text, level: cacheLevelKey });
    }

    console.log(`Generating new simplified version (Gemini) for: ${contentDoc.topic}, prompt level: "${promptLevelDescription}"`);
    const simplificationPrompt = `You are an expert tutor... [Your full simplification prompt here, same as before] ... Original Text:\n---\n${contentDoc.originalText}\n---\n\nSimplified Text (for ${promptLevelDescription} understanding):`;
    const safetySettings = [ /* ... */ { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }, { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }, { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }, { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }, ];
    const generationConfig = { /* ... */ };
    const result = await textModel.generateContent({ contents: [{ role: "user", parts: [{ text: simplificationPrompt }] }], generationConfig, safetySettings });
    const response = result.response;

    if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content?.parts) {
        // ... [Same detailed error handling for Gemini response as before] ...
        const blockReason = response?.promptFeedback?.blockReason || response?.candidates?.[0]?.finishReason;
        console.error("Content generation issue with Google Gemini (simplify):", { blockReason, fullResponse: JSON.stringify(response, null, 2) });
        let userMessage = 'AI failed to generate simplified content.';
        if (blockReason === "SAFETY" || response?.candidates?.[0]?.finishReason === "SAFETY") { userMessage = 'Content could not be simplified due to safety filters.';}
        else if (blockReason) { userMessage = `Content generation blocked: ${blockReason}.`;}
        return res.status(400).json({ error: userMessage });
    }
    const simplifiedText = response.candidates[0].content.parts.map(part => part.text).join("").trim();
    contentDoc.simplifiedVersions.push({ level: cacheLevelKey, text: simplifiedText, createdAt: new Date() });
    if (req.user?._id) contentDoc.lastUpdatedBy = req.user._id;
    await contentDoc.save();
    res.json({ simplifiedText, level: cacheLevelKey });
  } catch (err) {
    // ... [Same detailed error handling for Gemini API calls as before] ...
    console.error("Error in simplifyContent (Google Gemini):", err.message, err.stack);
    let userMessage = 'Failed to simplify content using Google AI.';
    if (err.message.toLowerCase().includes("api key") || err.message.toLowerCase().includes("permission denied")) { userMessage = "Google AI API key is invalid or not authorized."; return res.status(401).json({ error: userMessage });}
    if (err.message.toLowerCase().includes("quota") || err.message.toLowerCase().includes("rate limit")) { userMessage = "Google AI API quota exceeded."; return res.status(429).json({ error: userMessage });}
    res.status(500).json({ error: userMessage });
  }
};

// --- UPDATED generateVisualMap with new prompt ---
const generateVisualMap = async (req, res) => {
  if (!GOOGLE_API_KEY || !textModel) {
    console.error("Google AI SDK (textModel) not initialized for generateVisualMap.");
    return res.status(500).json({ error: "AI service is not configured." });
  }
  try {
    const { topic: topicSlug, format = 'mermaid' } = req.body;
    if (!topicSlug) { return res.status(400).json({ error: "Topic slug is required." }); }
    if (format !== 'mermaid') { return res.status(400).json({ error: "Only 'mermaid' format supported."}); }

    let contentDoc = await Content.findOne({ topic: topicSlug.toLowerCase().trim() });
    if (!contentDoc) { return res.status(404).json({ error: `Content for topic "${topicSlug}" not found.`});}

    const existingMap = contentDoc.visualMaps?.find(v => v.format === format);
    if (existingMap) { return res.json({ visualMap: existingMap }); }

    console.log(`Generating new visual map (Gemini) for: ${contentDoc.topic}, format: ${format}`);

    // ***** THIS IS THE CRUCIAL PROMPT UPDATE *****
    const visualMapPrompt = `
      You are an expert in creating educational diagrams.
      From the following educational text about "${contentDoc.topic.replace(/-/g, ' ')}", generate **valid MermaidJS mindmap syntax**.
      The mindmap should clearly represent the key concepts and their hierarchical relationships as described in the text.
      - The main topic, "${contentDoc.topic.replace(/-/g, ' ')}", should be the root node, styled like this: root((Main Topic)).
      - Use **indentation** to define parent-child relationships. Each level of indentation creates a new sub-level in the mindmap.
      - Do NOT use any custom keywords like "sub(...)" or "end". Only use standard Mermaid mindmap indentation.

      Here is an example of the correct Mermaid mindmap syntax structure:
      mindmap
        root((Example Main Topic))
          Level 1 Child A
            Level 2 Grandchild A.1
            Level 2 Grandchild A.2
          Level 1 Child B
            Level 2 Grandchild B.1
          Another Level 1 Child

      The output should ONLY be the MermaidJS code block itself, starting with the word "mindmap". Do not include any other explanatory text, markdown formatting (like \`\`\`mermaid or \`\`\`), or any words before or after the MermaidJS code. Just the pure MermaidJS syntax.

      Original Text (excerpt):
      ---
      ${contentDoc.originalText.substring(0, 3500)} 
      ---

      MermaidJS Mindmap Code:
    `;
    // **********************************************

    const safetySettings = [ /* ... */ { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }, { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }, { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }, { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }, ];
    const generationConfig = { temperature: 0.1, maxOutputTokens: 1500 }; // Low temp for structured output
    const result = await textModel.generateContent({ contents: [{ role: "user", parts: [{ text: visualMapPrompt }] }], generationConfig, safetySettings });
    const response = result.response;

    if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content?.parts) {
        // ... [Same detailed error handling for Gemini response as before] ...
        const blockReason = response?.promptFeedback?.blockReason || response?.candidates?.[0]?.finishReason;
        console.error("Visual map generation issue with Google Gemini:", { blockReason, fullResponse: JSON.stringify(response, null, 2) });
        let userMessage = 'AI failed to generate visual map.';
        if (blockReason === "SAFETY" || response?.candidates?.[0]?.finishReason === "SAFETY") { userMessage = 'Visual map could not be generated due to safety filters.';}
        else if (blockReason) { userMessage = `Visual map generation blocked: ${blockReason}.`;}
        return res.status(400).json({ error: userMessage });
    }
    let mermaidData = response.candidates[0].content.parts.map(part => part.text).join("").trim();
    // Clean potential markdown backticks
    mermaidData = mermaidData.replace(/^```mermaid\s*\n?([\s\S]*?)\n?```$/, '$1').trim();
    mermaidData = mermaidData.replace(/^```\s*\n?([\s\S]*?)\n?```$/, '$1').trim();

    console.log("[Controller] Gemini produced Mermaid data:", mermaidData.substring(0, 200) + "..."); // Log what Gemini returned

    const newVisualMap = { format, data: mermaidData, createdAt: new Date(), notes: "AI-Generated (Gemini)" };
    contentDoc.visualMaps.push(newVisualMap);
    if (req.user?._id) contentDoc.lastUpdatedBy = req.user._id;
    await contentDoc.save();
    res.json({ visualMap: newVisualMap });
  } catch (err) {
    // ... [Same detailed error handling for Gemini API calls as before] ...
    console.error("Error in generateVisualMap (Google Gemini):", err.message, err.stack);
    let userMessage = 'Failed to generate visual map using Google AI.';
    if (err.message.toLowerCase().includes("api key") || err.message.toLowerCase().includes("permission denied")) { userMessage = "Google AI API key is invalid or not authorized."; return res.status(401).json({ error: userMessage });}
    if (err.message.toLowerCase().includes("quota") || err.message.toLowerCase().includes("rate limit")) { userMessage = "Google AI API quota exceeded."; return res.status(429).json({ error: userMessage });}
    res.status(500).json({ error: userMessage });
  }
};

const generateAudioNarration = async (req, res) => {
    res.status(501).json({ error: "Audio narration not implemented." });
};
const findVideoExplainers = async (req, res) => {
  res.status(501).json({ error: "Video explainer sourcing not implemented." });
};

module.exports = {
  createContent,
  getAllContent,
  getContentById,
  updateContent,
  deleteContent,
  getContentByTopic,
  simplifyContent,
  generateVisualMap,
  generateAudioNarration,
  findVideoExplainers,
};