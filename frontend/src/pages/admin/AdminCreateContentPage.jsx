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
    topic: '', 
    originalText: '',
  });
  const [tags, setTags] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const basePath = window.location.pathname.startsWith('/admin') ? '/admin' : '/creator';


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
      tags: tags,
      imageUrls: imageUrls.filter(url => url && url.trim() !== ''),
      videoExplainers: [], 
      audioNarrations: [], 
    };

    if (!contentData.topic || !contentData.originalText) {
        setError("Topic Title and Original Text are required.");
        toast.error("Topic Title and Original Text are required.");
        setLoading(false);
        return;
    }

    try {
      const newContent = await createContent(contentData); // Backend returns the created content
      toast.success(`Content "${newContent.topic.replace(/-/g,' ')}" created successfully!`);
      navigate(`${basePath}/content/edit/${newContent._id}`); // Navigate to edit page of new content
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create content.';
      setError(errMsg); 
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link to={`${basePath}/content`} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" title="Back to Content List">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[var(--color-text-secondary)]">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.56l2.72 2.72a.75.75 0 1 1-1.06 1.06l-4-4a.75.75 0 0 1 0-1.06l4-4a.75.75 0 0 1 1.06 1.06L5.56 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold">Create New Content</h1>
        </div>

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