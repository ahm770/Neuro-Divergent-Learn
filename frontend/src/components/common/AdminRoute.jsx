// src/components/common/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    // Optional: Redirect to a specific "Access Denied" page or just dashboard
    return <Navigate to="/dashboard" replace />;
    // Or: return <div><h2>Access Denied</h2><p>You do not have permission to view this page.</p></div>;
  }

  return children ? children : <Outlet />;
};

export default AdminRoute;