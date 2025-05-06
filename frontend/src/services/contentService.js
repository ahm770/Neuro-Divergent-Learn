// src/services/contentService.js
import api from './api';

// --- User-facing functions (from Phase 1, ensure they exist) ---
export const getContentByTopic = async (topic) => {
  const response = await api.get(`/content/topic/${topic}`); // Corrected path
  return response.data;
};

export const simplifyContent = async (topic, level = 'easy') => {
  const response = await api.post(`/content/simplify`, { topic, level });
  return response.data;
};

export const generateVisualMap = async (topic, format = 'mermaid') => {
  const response = await api.post(`/content/visual-map`, { topic, format });
  return response.data;
};

export const generateAudioNarration = async (contentId, textToNarrate) => { // Simplified params for now
  // Assuming backend takes contentId and figures out text or uses default
  const response = await api.post(`/content/generate-audio`, { contentId, textToNarrate });
  return response.data;
};

export const findVideoExplainers = async (contentId, query) => {
  const response = await api.post(`/content/find-videos`, { contentId, query });
  return response.data; // Backend placeholder returns content with video added
};


// --- Admin-facing functions (NEW for Phase 3) ---
export const getAllContentForAdmin = async () => {
  // Backend route /api/content/ (GET) is protected but not admin-only by default in your current routes.
  // Let's assume it returns enough for admin listing or we create a new admin-specific one.
  // For now, we'll use the existing GET /api/content, which might need adjustment for admin needs.
  const response = await api.get('/content'); // This route is already `protect`
  return response.data; // Returns [{ topic, tags, createdAt }, ...]
};

export const getContentByIdForAdmin = async (contentId) => {
  const response = await api.get(`/content/${contentId}`); // This route is `protect, isAdmin`
  return response.data; // Returns full content object
};

export const createContent = async (contentData) => {
  // contentData = { topic, originalText, tags, imageUrls, videoExplainers, audioNarrations }
  const response = await api.post('/content/create', contentData); // `protect, isAdmin`
  return response.data;
};

export const updateContent = async (contentId, contentData) => {
  const response = await api.put(`/content/${contentId}`, contentData); // `protect, isAdmin`
  return response.data;
};

export const deleteContent = async (contentId) => {
  const response = await api.delete(`/content/${contentId}`); // `protect, isAdmin`
  return response.data; // Returns { message: 'Content removed successfully.' }
};