// src/components/common/CreatorRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CreatorRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-10">Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin' && user?.role !== 'creator') {
    // Redirect to dashboard if not admin or creator
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default CreatorRoute;