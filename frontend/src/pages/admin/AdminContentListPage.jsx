// src/pages/admin/AdminContentListPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllContentForAdmin, deleteContent } from '../../services/contentService';
// Assuming useAuth is not strictly needed here if AdminRoute protects it, but good for consistency if used elsewhere.
// import { useAuth } from '../../contexts/AuthContext';

const LoadingMessage = () => <div className="p-4 text-center text-[var(--color-text-secondary)]">Loading content...</div>;
const ErrorAlert = ({ message }) => (
    <div className="my-4 p-3 rounded text-sm bg-red-100 border border-red-300 text-red-700
                   dark:bg-red-900/20 dark:border-red-700 dark:text-red-300
                   body-theme-high-contrast:bg-hc-background body-theme-high-contrast:border-hc-link body-theme-high-contrast:text-hc-link"
    role="alert">
        {message}
    </div>
);


const AdminContentListPage = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const { token } = useAuth(); // Only if directly making calls that might not pass through AdminRoute's checks

  const fetchContents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllContentForAdmin();
      setContents(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch content list.');
      console.error("Fetch content list error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []); // Fetch on mount

  const handleDelete = async (contentId, topic) => {
    if (window.confirm(`Are you sure you want to delete the topic "${topic}"? This action cannot be undone.`)) {
      try {
        await deleteContent(contentId);
        setContents(prevContents => prevContents.filter(c => c._id !== contentId));
        // Consider a more subtle success message/toast notification
        alert(`Topic "${topic}" deleted successfully.`);
      } catch (err) {
        setError(err.response?.data?.error || `Failed to delete topic "${topic}".`);
        console.error("Delete content error:", err);
      }
    }
  };

  if (loading) return <LoadingMessage />;

  return (
    <div className="space-y-6"> {/* Add consistent spacing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1>Manage Content</h1> {/* Uses global H1 style */}
        <Link
          to="/admin/content/create"
          className="button-primary text-sm whitespace-nowrap" // Using generic button class
        >
          Create New Content
        </Link>
      </div>

      {error && <ErrorAlert message={error} />}

      {contents.length === 0 && !loading && (
        <div className="card text-center py-8"> {/* Using .card class */}
            <p className="text-[var(--color-text-secondary)]">No content found. Get started by creating some!</p>
        </div>
      )}

      {contents.length > 0 && (
        <div className="card overflow-x-auto p-0 md:p-0"> {/* Remove padding for table to fit edges */}
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-gray-100 dark:bg-slate-800 body-theme-high-contrast:bg-gray-900"> {/* Slightly different bg for thead */}
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Topic</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Tags</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Created At</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {contents.map((content) => (
                <tr key={content._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 body-theme-high-contrast:hover:bg-gray-700"> {/* Hover effect */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[var(--color-text-primary)] capitalize">{content.topic?.replace('-', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[var(--color-text-secondary)]">{content.tags?.join(', ') || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[var(--color-text-secondary)]">{new Date(content.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link to={`/admin/content/edit/${content._id}`} className="text-primary dark:text-primary-light body-theme-high-contrast:text-hc-link hover:underline">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(content._id, content.topic)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 body-theme-high-contrast:text-red-400 body-theme-high-contrast:hover:text-red-300 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminContentListPage;