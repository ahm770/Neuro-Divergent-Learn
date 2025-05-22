// ===== File: /src/services/taskService.js =====
import api from './api';

// Task Management
export const createTaskApi = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const getUserTasksApi = async (filters = {}) => {
  const response = await api.get('/tasks', { params: filters });
  return response.data;
};

export const getTaskByIdApi = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const updateTaskApi = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTaskApi = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// Learning Progress
export const getLearningProgressForContentApi = async (contentId) => {
    const response = await api.get(`/tasks/progress/content/${contentId}`); // Path matches backend
    return response.data;
};

export const getRecentLearningActivityApi = async (limit = 5) => {
    const response = await api.get(`/tasks/progress/recent`, { params: { limit } });
    return response.data;
};

export const logContentInteractionApi = async (interactionData) => {
    // interactionData = { contentId, mode, eventType: 'start'/'end', durationMs (if end) }
    const response = await api.post(`/tasks/progress/log-interaction`, interactionData);
    return response.data;
};