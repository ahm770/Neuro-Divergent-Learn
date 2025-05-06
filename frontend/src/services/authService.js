// src/services/authService.js
import api from './api';

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data && response.data.token) {
    localStorage.setItem('authToken', response.data.token); // Store token
    // You might want to store user info in context/state management too
  }
  return response.data; // { _id, name, email, role, preferences, token }
};

export const signupUser = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  if (response.data && response.data.token) {
    localStorage.setItem('authToken', response.data.token); // Store token
  }
  return response.data; // { _id, name, email, role, preferences, token }
};

export const logoutUser = () => {
  localStorage.removeItem('authToken');
  // Also clear any user state in your app's state management
};

export const getUserProfile = async () => {
   try {
     const response = await api.get('/auth/me');
     return response.data; // { _id, name, email, preferences, createdAt }
   } catch (error) {
     console.error("Error fetching user profile:", error.response ? error.response.data : error.message);
     if (error.response && error.response.status === 401) {
        logoutUser(); // If unauthorized, log out the user
     }
     throw error; // Re-throw to be handled by the calling component
   }
};

export const updateUserPreferences = async (preferencesData) => {
    try {
        const response = await api.put('/auth/preferences', preferencesData);
        return response.data; // { message, preferences }
    } catch (error) {
        console.error("Error updating preferences:", error.response ? error.response.data : error.message);
        throw error;
    }
};