// src/services/authService.js
import api from './api';

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data; // { _id, name, email, token }
};

export const signupUser = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data; // { _id, name, email, token }
};

// Optional: Function to verify token / get user profile
export const getUserProfile = async () => {
   // Define a backend route like GET /api/auth/profile later
   // For now, we rely on info returned during login/signup
   // const response = await api.get('/auth/profile');
   // return response.data;
   return null; // Placeholder
};