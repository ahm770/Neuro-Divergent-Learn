// src/pages/admin/AdminCreateContentPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createContent } from '../../services/contentService';
import TagInput from '../../components/admin/TagInput';
import DynamicUrlInput from '../../components/admin/DynamicUrlInput';
import { toast } from 'react-toastify';


const FormField = ({ id, label, type = 'text', value, onChange, required = false, textarea = false, placeholder, name, rows = 3 }) => (
  <div className="form-field-default">
    <label htmlFor={id || name} className="form-label-default">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
    {textarea ? ( <textarea id={id || name} name={name || id} rows={rows} value={value} onChange={onChange} required={required} placeholder={placeholder} className="form-input-default"/>
    ) : ( <input type={type} id={id || name} name={name || id} value={value} onChange={onChange} required={required} placeholder={placeholder} className="form-input-default"/> )}
  </div>
);
const ErrorAlert = ({ message }) => (
    <div className="my-4 p-3 rounded text-sm bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300 body-theme-high-contrast:bg-hc-background body-theme-high-contrast:border-hc-link body-theme-high-contrast:text-hc-link" role="alert">{message}</div>
);

const AdminCreateContentPage = () => {
  const [formData, setFormData] = useState({
    topic: '', // This will be the human-readable title, slug generated on backend
    originalText: '',
  });
  const [tags, setTags] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // For form-level persistent errors
  const navigate = useNavigate();
  const basePath = window.location.pathname.startsWith('/admin') ? '/admin' : '/creator';


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Clear previous form error
    // toast.dismiss(); // Clear existing toasts

    const contentData = {
      ...formData,
      topic: formData.topic.trim(), // Send human-readable title
      tags: tags,
      imageUrls: imageUrls.filter(url => url && url.trim() !== ''), // Filter out empty strings
      videoExplainers: [], // Initialize as empty, can be added in edit
      audioNarrations: [], // Initialize as empty, can be added in edit
    };

    if (!contentData.topic || !contentData.originalText) {
        setError("Topic Title and Original Text are required.");
        toast.error("Topic Title and Original Text are required.");
        setLoading(false);
        return;
    }

    try {
      await createContent(contentData);
      toast.success('Content created successfully!');
      navigate(`${basePath}/content`); // Navigate back to the list for the current role
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create content.';
      setError(errMsg); // Set form error for display
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to={`${basePath}/content`} className="text-sm inline-block mb-2 hover:underline text-[var(--color-link)]">
        ← Back to Content List
      </Link>
      <h1 className="text-2xl font-semibold">Create New Content</h1>

      <form onSubmit={handleSubmit} className="card max-w-2xl mx-auto p-6 md:p-8">
        {error && <ErrorAlert message={error} />}

        <FormField name="topic" label="Topic Title (human-readable)" value={formData.topic} onChange={handleChange} required placeholder="e.g., Photosynthesis Basics"/>
        <FormField name="originalText" label="Original Content Text" value={formData.originalText} onChange={handleChange} textarea rows="10" required placeholder="Enter the full educational text here..."/>
        
        <TagInput
          initialTags={tags}
          onChange={setTags}
          label="Tags"
          placeholder="Add relevant tags"
        />

        <DynamicUrlInput
          initialUrls={imageUrls}
          onChange={setImageUrls}
          label="Image URLs"
          placeholder="https://example.com/image.jpg"
        />

        <p className="text-xs text-[var(--color-text-secondary)] mt-6 mb-2">
            Video explainers and audio narrations can be added after creation via the "Edit Content" page.
        </p>

        <button type="submit" disabled={loading} className="button-primary w-full mt-4">
          {loading ? 'Creating...' : 'Create Content'}
        </button>
      </form>
    </div>
  );
};

export default AdminCreateContentPage;