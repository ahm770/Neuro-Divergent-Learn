// src/services/userService.js
import api from './api';

export const getAllUsersAdmin = async (params = {}) => {
  const cleanParams = {};
  for (const key in params) {
    if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
      cleanParams[key] = params[key];
    }
  }
  const response = await api.get('/users', { params: cleanParams });
  return response.data;
};

export const getUserByIdAdmin = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateUserRoleAdmin = async (userId, role) => {
  const response = await api.put(`/users/${userId}/role`, { role });
  return response.data;
};

export const deleteUserAdmin = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};