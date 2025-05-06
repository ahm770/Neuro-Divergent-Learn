// src/pages/admin/AdminDashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // To greet the admin

// Example Icons (using simple text, replace with actual icon components if you have them)
const ContentIcon = () => <span className="text-2xl mr-2">📚</span>; // Simple emoji icon
const UsersIcon = () => <span className="text-2xl mr-2">👥</span>;
const SettingsIcon = () => <span className="text-2xl mr-2">⚙️</span>;
const AnalyticsIcon = () => <span className="text-2xl mr-2">📊</span>;


const AdminDashboardPage = () => {
  const { user } = useAuth();

  // Placeholder data - in a real app, you might fetch some stats here
  const stats = {
    totalContent: 15, // Example: fetch from an API endpoint
    totalUsers: 120,  // Example
    pendingApprovals: 0 // Example
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-primary mb-4">Admin Dashboard</h1>
      <p className="mb-8 text-lg text-gray-700">
        Welcome back, <span className="font-semibold">{user?.name || user?.email || 'Admin'}</span>!
      </p>

      {/* Quick Stats Section (Optional - requires backend data) */}
      {/*
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Total Content Topics</h3>
          <p className="text-3xl font-bold text-primary">{stats.totalContent}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Registered Users</h3>
          <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
        </div>
        {stats.pendingApprovals > 0 && (
          <div className="bg-orange-100 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-orange-700 mb-2">Pending Approvals</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
          </div>
        )}
      </div>
      */}

      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Management Sections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Manage Content Card */}
        <Link
          to="/admin/content"
          className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out transform hover:-translate-y-1"
        >
          <div className="flex items-center mb-3">
            <ContentIcon />
            <h3 className="text-xl font-semibold text-gray-700">Manage Content</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Create, edit, and delete learning topics and their associated materials.
          </p>
        </Link>

        {/* Manage Users Card (Future Feature) */}
        <div
          // to="/admin/users" // Uncomment when implemented
          className="block p-6 bg-gray-100 rounded-lg shadow-md cursor-not-allowed opacity-60"
          title="User management coming soon"
        >
          <div className="flex items-center mb-3">
            <UsersIcon />
            <h3 className="text-xl font-semibold text-gray-500">Manage Users</h3>
          </div>
          <p className="text-gray-500 text-sm">
            View and manage user accounts. (Coming Soon)
          </p>
        </div>

        {/* Platform Settings Card (Future Feature) */}
        <div
          // to="/admin/settings" // Uncomment when implemented
          className="block p-6 bg-gray-100 rounded-lg shadow-md cursor-not-allowed opacity-60"
          title="Platform settings coming soon"
        >
          <div className="flex items-center mb-3">
            <SettingsIcon />
            <h3 className="text-xl font-semibold text-gray-500">Platform Settings</h3>
          </div>
          <p className="text-gray-500 text-sm">
            Configure global settings for the learning portal. (Coming Soon)
          </p>
        </div>

        {/* Analytics/Reports Card (Future Feature) */}
        <div
          // to="/admin/analytics" // Uncomment when implemented
          className="block p-6 bg-gray-100 rounded-lg shadow-md cursor-not-allowed opacity-60"
          title="Analytics coming soon"
        >
          <div className="flex items-center mb-3">
            <AnalyticsIcon />
            <h3 className="text-xl font-semibold text-gray-500">Analytics & Reports</h3>
          </div>
          <p className="text-gray-500 text-sm">
            View usage statistics and learning progress insights. (Coming Soon)
          </p>
        </div>

        {/* Add more admin sections as cards here */}
      </div>
    </div>
  );
};

export default AdminDashboardPage;