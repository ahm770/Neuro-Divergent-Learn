// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getPublishedContentList } from '../services/contentService';

const LoadingSpinner = ({text = "Loading topics..."}) => (
  <div className="text-center p-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-link)] mx-auto mb-2"></div>
    <p className="text-[var(--color-text-secondary)]">{text}</p>
  </div>
);
const ErrorMessage = ({ message }) => (
  <div className="text-center p-4 my-4 text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded border border-red-300">
    Error: {message}
  </div>
);


const DashboardPage = () => {
  const { user } = useAuth();
  const [allTopics, setAllTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublishedContentList({ limit: 200, sortBy: 'topic:asc' }); // Fetch a large number for client-side filtering
      setAllTopics(data.contents || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load topics.');
      console.error("Dashboard fetch topics error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const filteredTopics = useMemo(() => {
    if (!searchTerm.trim()) return allTopics;
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return allTopics.filter(content =>
      content.topic.toLowerCase().replace(/-/g, ' ').includes(lowerSearchTerm) ||
      (content.tags && content.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))) ||
      (content.originalText && content.originalText.toLowerCase().substring(0, 300).includes(lowerSearchTerm))
    );
  }, [allTopics, searchTerm]);

  return (
    <div className="space-y-8">
      <div>
        <h1>Dashboard</h1>
        <p className="text-lg text-[var(--color-text-secondary)]">
          Welcome back, {user?.name || user?.email}!
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Explore Topics:</h2>
        <div className="mb-6">
          <input
            type="search"
            placeholder="Search topics, tags, or keywords..."
            className="form-input-default w-full sm:w-2/3 md:w-1/2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search topics"
          />
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}
        
        {!loading && !error && allTopics.length === 0 && (
            <p className="text-[var(--color-text-secondary)] text-center py-4">No topics available yet. Content creators can add more!</p>
        )}
        {!loading && !error && allTopics.length > 0 && filteredTopics.length === 0 && searchTerm.trim() && (
            <p className="text-[var(--color-text-secondary)] text-center py-4">No topics match your search: "{searchTerm}". Try a different keyword.</p>
        )}

        {!loading && !error && filteredTopics.length > 0 && (
          <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar"> {/* Added max-height and scroll */}
            {filteredTopics.map(content => (
              <li key={content._id || content.topic}>
                <Link
                  to={`/content/${content.topic}`} 
                  className="block p-3 rounded-md hover:bg-primary/10 dark:hover:bg-primary-light/10 body-theme-high-contrast:hover:bg-hc-link body-theme-high-contrast:hover:text-hc-background transition-colors duration-150 border border-transparent hover:border-[var(--color-border)]"
                >
                  <span className="font-medium text-base capitalize">
                    {content.topic.replace(/-/g, ' ')}
                  </span>
                  {content.originalText && (
                     <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                        {content.originalText}
                     </p>
                  )}
                   {content.tags && content.tags.length > 0 && (
                    <div className="mt-1.5 space-x-1">
                        {content.tags.slice(0,3).map(tag => (
                            <span key={tag} className="text-xs bg-gray-200 dark:bg-slate-700 text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded-full">{tag}</span>
                        ))}
                        {content.tags.length > 3 && <span className="text-xs text-[var(--color-text-secondary)]">+ {content.tags.length - 3} more</span>}
                    </div>
                   )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
            <h3 className="text-lg font-semibold mb-3">Your Preferences</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Customize your learning experience to suit your needs.
            </p>
            <Link to="/profile" className="button-secondary text-sm">
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