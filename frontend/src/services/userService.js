// src/services/userService.js
import api from './api';

export const getAllUsersAdmin = async () => {
  const response = await api.get('/users');
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