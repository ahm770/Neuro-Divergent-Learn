// src/pages/admin/AdminDashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ContentIcon = () => <span className="text-2xl mr-2">📚</span>;
const UsersIcon = () => <span className="text-2xl mr-2">👥</span>;
const SettingsIcon = () => <span className="text-2xl mr-2">⚙️</span>;
const AnalyticsIcon = () => <span className="text-2xl mr-2">📊</span>;


const AdminDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1>Admin Dashboard</h1>
      <p className="mb-8 text-lg text-[var(--color-text-secondary)]">
        Welcome back, <span className="font-semibold">{user?.name || user?.email || 'Admin'}</span>!
      </p>

      <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6">Management Sections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/admin/content"
          className="card hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-3">
            <ContentIcon />
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Manage Content</h3>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm">
            Create, edit, and delete learning topics and their associated materials.
          </p>
        </Link>

        <Link
          to="/admin/users"
          className="card hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-3">
            <UsersIcon />
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Manage Users</h3>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm">
            View user accounts, change roles, and manage platform access.
          </p>
        </Link>

        <div
          className="card opacity-60 cursor-not-allowed"
          title="Platform settings coming soon"
        >
          <div className="flex items-center mb-3">
            <SettingsIcon />
            <h3 className="text-xl font-semibold text-gray-500 dark:text-slate-400">Platform Settings</h3>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            Configure global settings for the learning portal. (Coming Soon)
          </p>
        </div>

        <div
          className="card opacity-60 cursor-not-allowed"
          title="Analytics coming soon"
        >
          <div className="flex items-center mb-3">
            <AnalyticsIcon />
            <h3 className="text-xl font-semibold text-gray-500 dark:text-slate-400">Analytics & Reports</h3>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            View usage statistics and learning progress insights. (Coming Soon)
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;