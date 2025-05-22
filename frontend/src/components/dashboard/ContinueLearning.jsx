// src/components/dashboard/ContinueLearning.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const LoadingItem = () => (
    <div className="p-3 border border-[var(--color-border)] rounded-md animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2"></div>
    </div>
);

const ContinueLearning = ({ activities, loading, error }) => {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Continue Learning</h2>
      {loading && (
        <div className="space-y-2">
            <LoadingItem /><LoadingItem />
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && activities.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)] text-center py-3">
          No recent activity. Start exploring topics!
        </p>
      )}
      {!loading && !error && activities.length > 0 && (
        <ul className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
          {activities.map(activity => (
            activity.contentId ? (
              <li key={activity._id || activity.contentId._id}>
                <Link
                  to={`/content/${activity.contentId.topic}`}
                  className="block p-3 border border-[var(--color-border)] rounded-md hover:bg-primary/5 dark:hover:bg-primary-light/5 transition-colors"
                >
                  <h3 className="text-base font-medium capitalize text-[var(--color-text-primary)]">
                    {activity.contentId.topic.replace(/-/g, ' ')}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Last accessed: {new Date(activity.lastAccessed).toLocaleDateString()}
                    {activity.status === 'completed' && <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 rounded-full">Completed</span>}
                  </p>
                </Link>
              </li>
            ) : null
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContinueLearning;