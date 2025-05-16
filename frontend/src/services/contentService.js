// src/services/contentService.js
import api from './api';

export const getContentByTopic = async (topic) => {
  const response = await api.get(`/content/topic/${topic}`);
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

export const generateAudioNarration = async (contentId, textToNarrate) => {
  const response = await api.post(`/content/generate-audio`, { contentId, textToNarrate });
  return response.data;
};

export const findVideoExplainers = async (contentId, query) => {
  const response = await api.post(`/content/find-videos`, { contentId, query });
  return response.data;
};

export const getPublishedContentList = async (params = {}) => {
  const response = await api.get('/content', { params }); 
  return response.data; 
};

export const getContentByIdForEditing = async (contentId) => {
  const response = await api.get(`/content/${contentId}`); 
  return response.data;
};

export const createContent = async (contentData) => {
  const response = await api.post('/content/create', contentData);
  return response.data;
};

export const updateContent = async (contentId, contentData) => {
  const response = await api.put(`/content/${contentId}`, contentData);
  return response.data;
};

export const deleteContent = async (contentId) => {
  const response = await api.delete(`/content/${contentId}`);
  return response.data;
};