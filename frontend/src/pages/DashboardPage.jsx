// src/pages/DashboardPage.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();

  // Example list of topics - you'd likely fetch this later
  const topics = ['photosynthesis', 'gravity', 'react-basics', 'python-loops', 'neurodiversity-awareness'];

  return (
    <div className="space-y-8"> {/* Added space-y for better vertical rhythm */}
      <div>
        <h1>Dashboard</h1> {/* Uses global H1 style */}
        <p className="text-lg text-[var(--color-text-secondary)]">
          Welcome back, {user?.name || user?.email}!
        </p>
      </div>

      <div className="card"> {/* Using .card class */}
        <h2 className="text-xl font-semibold mb-4">Available Topics:</h2>
        {topics.length > 0 ? (
          <ul className="space-y-3">
            {topics.map(topic => (
              <li key={topic}>
                <Link
                  to={`/content/${topic}`}
                  className="block p-3 rounded-md hover:bg-primary/10 dark:hover:bg-primary-light/10 body-theme-high-contrast:hover:bg-hc-link body-theme-high-contrast:hover:text-hc-background transition-colors duration-150"
                >
                  <span className="font-medium text-base capitalize">
                    {topic.replace(/-/g, ' ')}
                  </span>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Explore the fundamentals of {topic.replace(/-/g, ' ')}.
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--color-text-secondary)]">No topics available yet. Check back soon!</p>
        )}
      </div>

      {/* Example of another card for quick actions or stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
            <h3 className="text-lg font-semibold mb-3">Your Preferences</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Customize your learning experience to suit your needs.
            </p>
            <Link to="/profile" className="button-secondary text-sm"> {/* Using generic button class */}
                Go to Profile Settings
            </Link>
        </div>
         <div className="card">
            <h3 className="text-lg font-semibold mb-3">Learning Goals (Coming Soon)</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
                Track your progress and set new learning objectives.
            </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;