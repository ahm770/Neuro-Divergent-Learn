// src/contexts/AuthContext.jsx (Unified)
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  loginUser as apiLoginUser,
  signupUser as apiSignupUser,
  getUserProfile as apiGetUserProfile,
  updateUserPreferences as apiUpdateUserPreferences,
  logoutUser as apiLogoutUser // This one just clears localStorage in authService
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Will hold the FULL user object
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [loading, setLoading] = useState(true); // For initial load, login, signup, etc.
  const [error, setError] = useState(null);

  // Effect to load user on initial mount if token exists
  useEffect(() => {
    const loadUserOnMount = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken); // Make sure token state is set
        setLoading(true);
        try {
          const userData = await apiGetUserProfile(); // Fetches full user data with preferences
          setUser(userData);
          setError(null);
        } catch (err) {
          console.error("AuthContext: Failed to fetch user profile on mount", err);
          // If token is invalid (e.g., 401 error), logout
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser'); // If you were storing this
            setToken(null);
            setUser(null);
          }
          setError(err.response?.data?.error || 'Failed to load user data.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // No token, not loading user
      }
    };
    loadUserOnMount();
  }, []); // Empty dependency array: run once on mount

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLoginUser(credentials); // API returns { _id, name, email, preferences, token }
      localStorage.setItem('authToken', data.token);
      // No need to store 'authUser' separately in localStorage if `user` state has it all
      localStorage.removeItem('authUser'); // Clean up old storage if any
      setToken(data.token);
      setUser({ // Set the full user object
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        preferences: data.preferences,
        createdAt: data.createdAt // If backend sends it
      });
      setLoading(false);
      return true;
    } catch (err) {
      console.error("AuthContext: Login failed", err);
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
      return false;
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiSignupUser(userData); // API returns { _id, name, email, preferences, token }
      localStorage.setItem('authToken', data.token);
      localStorage.removeItem('authUser'); // Clean up old storage if any
      setToken(data.token);
      setUser({ // Set the full user object
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        preferences: data.preferences,
        createdAt: data.createdAt // If backend sends it
      });
      setLoading(false);
      return true;
    } catch (err) {
      console.error("AuthContext: Signup failed", err);
      setError(err.response?.data?.error || 'Signup failed');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    apiLogoutUser(); // This function in authService clears localStorage
    setToken(null);
    setUser(null);
    setError(null);
    // No need to interact with `api.defaults.headers.common['Authorization']`
    // as the interceptor in `services/api.js` handles token presence.
  };

  const updateUserPreferences = async (preferencesData) => {
    if (!user) {
      const err = new Error("User not logged in to update preferences");
      setError(err.message);
      throw err;
    }
    setLoading(true); // Can use a more specific loading state if preferred for UX
    setError(null);
    try {
      const { preferences: updatedPreferences } = await apiUpdateUserPreferences(preferencesData);
      setUser(prevUser => ({ ...prevUser, preferences: updatedPreferences }));
      setLoading(false);
      return updatedPreferences;
    } catch (err) {
      console.error("AuthContext: Failed to update preferences", err);
      setError(err.response?.data?.error || 'Failed to update preferences.');
      setLoading(false);
      throw err;
    }
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      loading,
      error,
      login,
      signup,
      logout,
      updateUserPreferences,
      setError // Good to expose setError to clear it manually if needed
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};