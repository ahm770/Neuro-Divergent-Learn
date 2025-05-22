// ===== File: /src/services/contentService.js =====
import api from './api';

export const getContentByTopic = async (topicSlug) => {
  const response = await api.get(`/content/topic/${topicSlug}`);
  // response.data will now include `learningProgress` if user is logged in
  return response.data;
};

// `level` can now be 'eli5', 'easy', 'high_school', 'college_intro', etc.
export const simplifyContent = async (topicSlug, level = 'easy') => {
  const response = await api.post(`/content/simplify`, { topic: topicSlug, level });
  // response.data will include { simplifiedText, level, topicId }
  return response.data;
};

export const generateVisualMap = async (topicSlug, format = 'mermaid') => {
  const response = await api.post(`/content/visual-map`, { topic: topicSlug, format });
  // response.data will include { visualMap, topicId }
  return response.data;
};

export const generateAudioNarration = async (contentId, textToNarrate) => {
  const response = await api.post(`/content/generate-audio`, { contentId, textToNarrate });
  // response.data will include { message, narration, topicId }
  return response.data;
};

export const findVideoExplainers = async (contentId, query) => {
  const response = await api.post(`/content/find-videos`, { contentId, query });
  return response.data; // This is currently a 501 not implemented
};

export const getPublishedContentList = async (params = {}) => {
  const cleanParams = {};
  for (const key in params) {
    if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
      cleanParams[key] = params[key];
    }
  }
  const response = await api.get('/content', { params: cleanParams });
  return response.data;
};

export const getContentByIdForEditing = async (contentId) => {
  const response = await api.get(`/content/${contentId}`);
  return response.data;
};

export const createContent = async (contentData) => {
  // contentData might now include learningObjectives, keyVocabulary
  const response = await api.post('/content/create', contentData);
  return response.data;
};

export const updateContent = async (contentId, contentData) => {
  // contentData might now include learningObjectives, keyVocabulary
  const response = await api.put(`/content/${contentId}`, contentData);
  return response.data;
};

export const deleteContent = async (contentId) => {
  const response = await api.delete(`/content/${contentId}`);
  return response.data;
};