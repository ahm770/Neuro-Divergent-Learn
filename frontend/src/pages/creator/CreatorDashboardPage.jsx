// src/pages/creator/CreatorDashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ContentIcon = () => <span className="text-2xl mr-2">📝</span>;

const CreatorDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1>Creator Studio</h1>
      <p className="mb-8 text-lg text-[var(--color-text-secondary)]">
        Welcome, <span className="font-semibold">{user?.name || user?.email || 'Creator'}</span>! Manage your learning content here.
      </p>

      <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6">Your Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/creator/content"
          className="card hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-3">
            <ContentIcon />
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Manage Content</h3>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm">
            Create new topics, edit existing materials, and view all content.
          </p>
        </Link>
        {/* Add more creator-specific links here if needed */}
      </div>
    </div>
  );
};

export default CreatorDashboardPage;