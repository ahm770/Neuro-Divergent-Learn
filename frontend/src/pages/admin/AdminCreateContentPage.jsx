// src/pages/admin/AdminCreateContentPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createContent } from '../../services/contentService';

// Reusable FormField component (can be imported from a common location if shared)
const FormField = ({ id, label, type = 'text', value, onChange, required = false, textarea = false, placeholder, name, rows = 3 }) => (
  <div className="form-field-default">
    <label htmlFor={id || name} className="form-label-default">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
    {textarea ? (
      <textarea
        id={id || name}
        name={name || id}
        rows={rows}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="form-input-default"
      />
    ) : (
      <input
        type={type}
        id={id || name}
        name={name || id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="form-input-default"
      />
    )}
  </div>
);
const ErrorAlert = ({ message }) => ( /* ... same as in Edit page ... */
    <div className="my-4 p-3 rounded text-sm bg-red-100 border border-red-300 text-red-700
                   dark:bg-red-900/20 dark:border-red-700 dark:text-red-300
                   body-theme-high-contrast:bg-hc-background body-theme-high-contrast:border-hc-link body-theme-high-contrast:text-hc-link"
    role="alert">
        {message}
    </div>
);


const AdminCreateContentPage = () => {
  const [formData, setFormData] = useState({
    topic: '',
    originalText: '',
    tags: '',
    imageUrls: '',
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
      topic: formData.topic.trim(),
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      imageUrls: formData.imageUrls ? formData.imageUrls.split(',').map(url => url.trim()).filter(Boolean) : [],
      videoExplainers: [], // Initialize as empty, can be added in edit
      audioNarrations: [], // Initialize as empty
    };

    if (!contentData.topic || !contentData.originalText) {
        setError("Topic and Original Text are required.");
        setLoading(false);
        return;
    }

    try {
      await createContent(contentData);
      alert('Content created successfully!'); // Consider a toast
      navigate('/admin/content');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create content.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/admin/content" className="text-sm inline-block mb-2">← Back to Content List</Link>
      <h1>Create New Content</h1>

      <form onSubmit={handleSubmit} className="card max-w-2xl mx-auto p-6 md:p-8">
        {error && <ErrorAlert message={error} />}

        <FormField
          name="topic"
          label="Topic Title"
          value={formData.topic}
          onChange={handleChange}
          required
          placeholder="e.g., Photosynthesis Basics"
        />
        <FormField
          name="originalText"
          label="Original Content Text"
          value={formData.originalText}
          onChange={handleChange}
          textarea
          rows="10"
          required
          placeholder="Enter the full educational text here..."
        />
        <FormField
          name="tags"
          label="Tags (comma-separated)"
          value={formData.tags}
          onChange={handleChange}
          placeholder="e.g., biology, science, plants"
        />
        <FormField
          name="imageUrls"
          label="Image URLs (comma-separated)"
          value={formData.imageUrls}
          onChange={handleChange}
          placeholder="e.g., https://example.com/image1.jpg"
        />

        <p className="text-xs text-[var(--color-text-secondary)] mt-6 mb-2">
            Video explainers and audio narrations can be added after creation via the "Edit Content" page.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="button-primary w-full mt-4"
        >
          {loading ? 'Creating...' : 'Create Content'}
        </button>
      </form>
    </div>
  );
};

export default AdminCreateContentPage;