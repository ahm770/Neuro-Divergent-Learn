// src/pages/admin/AdminContentListPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllContentForAdmin, deleteContent } from '../../services/contentService';
import { useAuth } from '../../contexts/AuthContext'; // For user role check if needed, though route protects

const AdminContentListPage = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth(); // To ensure API calls are authorized

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
    if (token) { // Ensure token is available before fetching
        fetchContents();
    }
  }, [token]);

  const handleDelete = async (contentId, topic) => {
    if (window.confirm(`Are you sure you want to delete the topic "${topic}"? This action cannot be undone.`)) {
      try {
        await deleteContent(contentId);
        setContents(prevContents => prevContents.filter(c => c._id !== contentId));
        alert(`Topic "${topic}" deleted successfully.`);
      } catch (err) {
        setError(err.response?.data?.error || `Failed to delete topic "${topic}".`);
        console.error("Delete content error:", err);
      }
    }
  };

  if (loading) return <div className="p-4">Loading content...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Manage Content</h1>
        <Link
          to="/admin/content/create"
          className="bg-secondary hover:bg-pink-500 text-white font-semibold py-2 px-4 rounded transition duration-200"
        >
          Create New Content
        </Link>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

      {contents.length === 0 && !loading && (
        <p>No content found. Get started by creating some!</p>
      )}

      {contents.length > 0 && (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contents.map((content) => (
                <tr key={content._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 capitalize">{content.topic?.replace('-', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{content.tags?.join(', ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{new Date(content.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/admin/content/edit/${content._id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(content._id, content.topic)}
                      className="text-red-600 hover:text-red-900"
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