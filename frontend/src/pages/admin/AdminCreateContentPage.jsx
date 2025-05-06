// src/pages/admin/AdminCreateContentPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createContent } from '../../services/contentService';

// A simple reusable form field component (optional, but can reduce repetition)
const FormField = ({ id, label, type = 'text', value, onChange, required = false, textarea = false, placeholder }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
    {textarea ? (
      <textarea
        id={id}
        name={id}
        rows="10"
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
      />
    ) : (
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
      />
    )}
  </div>
);


const AdminCreateContentPage = () => {
  const [formData, setFormData] = useState({
    topic: '',
    originalText: '',
    tags: '', // Comma-separated string for tags
    imageUrls: '', // Comma-separated string for image URLs
    // videoExplainers and audioNarrations might be handled differently in a more complex UI
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const contentData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      imageUrls: formData.imageUrls ? formData.imageUrls.split(',').map(url => url.trim()).filter(Boolean) : [],
      // For MVP, videoExplainers and audioNarrations can be empty arrays or handled later
      videoExplainers: [],
      audioNarrations: [],
    };

    try {
      await createContent(contentData);
      alert('Content created successfully!');
      navigate('/admin/content');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create content.');
      console.error("Create content error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Link to="/admin/content" className="text-primary hover:underline mb-4 inline-block">← Back to Content List</Link>
      <h1 className="text-3xl font-bold text-primary mb-6">Create New Content</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 shadow-md rounded-lg">
        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

        <FormField
          id="topic"
          label="Topic Title"
          value={formData.topic}
          onChange={handleChange}
          required
          placeholder="e.g., Photosynthesis Basics"
        />
        <FormField
          id="originalText"
          label="Original Content Text"
          value={formData.originalText}
          onChange={handleChange}
          textarea
          required
          placeholder="Enter the full educational text here..."
        />
        <FormField
          id="tags"
          label="Tags (comma-separated)"
          value={formData.tags}
          onChange={handleChange}
          placeholder="e.g., biology, science, plants"
        />
        <FormField
          id="imageUrls"
          label="Image URLs (comma-separated)"
          value={formData.imageUrls}
          onChange={handleChange}
          placeholder="e.g., https://example.com/image1.jpg, https://example.com/image2.png"
        />

        {/* More complex fields for videoExplainers, audioNarrations could be added here */}
        {/* For example, a way to add multiple URL inputs for videos */}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Content'}
        </button>
      </form>
    </div>
  );
};

export default AdminCreateContentPage;