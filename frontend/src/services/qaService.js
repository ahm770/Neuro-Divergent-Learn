// ===== File: /src/services/qaService.js =====
import api from './api';

export const askQuestionApi = async (question, topic, contentId = null) => {
  const payload = { question, topic };
  if (contentId) {
    payload.contentId = contentId;
  }
  const response = await api.post('/qa/ask', payload);
  return response.data; // { answer }
};