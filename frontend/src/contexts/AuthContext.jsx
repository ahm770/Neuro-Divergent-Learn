// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, signupUser } from '../services/authService';
import api from '../services/api'; // Import api to potentially clear defaults on logout

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [loading, setLoading] = useState(true); // Start loading true to check token
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        // Optionally: Verify token with backend here
        // For simplicity now, we assume token means logged in
        // We might need to store basic user info (like name/email) in localStorage too
        // Or fetch it using getUserProfile() if implementing that route
        const storedUser = localStorage.getItem('authUser');
         if (storedUser) {
            setUser(JSON.parse(storedUser));
         } else {
             // If only token is stored, maybe try fetching user profile
             // console.log("Token found, user data missing - consider fetching profile");
         }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(credentials);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify({ _id: data._id, name: data.name, email: data.email })); // Store user info
      setToken(data.token);
      setUser({ _id: data._id, name: data.name, email: data.email });
      setLoading(false);
      return true; // Indicate success
    } catch (err) {
      console.error("Login failed:", err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
      return false; // Indicate failure
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await signupUser(userData);
      localStorage.setItem('authToken', data.token);
       localStorage.setItem('authUser', JSON.stringify({ _id: data._id, name: data.name, email: data.email }));
      setToken(data.token);
      setUser({ _id: data._id, name: data.name, email: data.email });
      setLoading(false);
      return true; // Indicate success
    } catch (err) {
      console.error("Signup failed:", err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Signup failed');
      setLoading(false);
      return false; // Indicate failure
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
     localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    // Optionally clear Axios default headers if needed, though interceptor handles it
    // delete api.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, error, login, signup, logout, setError }}>
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