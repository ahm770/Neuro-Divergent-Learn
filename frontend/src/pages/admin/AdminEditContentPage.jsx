// src/pages/admin/AdminEditContentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getContentByIdForAdmin, updateContent } from '../../services/contentService';
import MermaidDiagram from '../../components/common/MermaidDiagram';
import TagInput from '../../components/admin/TagInput';
import DynamicUrlInput from '../../components/admin/DynamicUrlInput';

// Reusable FormField component (can be moved to a common components folder)
const FormField = ({ id, label, type = 'text', value, onChange, required = false, textarea = false, placeholder, disabled = false, name, rows = 3, children }) => (
  <div className="form-field-default"> {/* Using generic wrapper from index.css */}
    <label htmlFor={id || name} className="form-label-default">{label}{required && !disabled && <span className="text-red-500 ml-1">*</span>}</label>
    {textarea ? (
      <textarea
        id={id || name}
        name={name || id}
        rows={rows}
        value={value}
        onChange={onChange}
        required={required && !disabled}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-input-default ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
      />
    ) : children ? ( // For select or other custom inputs that need the form-input-default wrapper
      <div className={`form-input-default p-0 ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}> {/* Remove padding for select if it's direct child */}
        {children}
      </div>
    ): (
      <input
        type={type}
        id={id || name}
        name={name || id}
        value={value}
        onChange={onChange}
        required={required && !disabled}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-input-default ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
      />
    )}
  </div>
);

const LoadingMessage = () => <div className="p-6 text-center text-[var(--color-text-secondary)]">Loading content details...</div>;
const ErrorAlert = ({ message, onBack }) => (
    <div className="p-6 text-center card my-4">
        <p className="text-red-600 dark:text-red-400 body-theme-high-contrast:text-hc-link mb-4">{message}</p>
        {onBack && <Link to={onBack} className="button-secondary text-sm">Go back</Link>}
    </div>
);


const AdminEditContentPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    topic: '',
    originalText: '',
    videoExplainers: [],
    audioNarrations: [],
    simplifiedVersions: [], // These will be populated but are read-only here
    visualMaps: [],         // These will be populated but are read-only here
  });
  const [tags, setTags] = useState([]); // Separate state for tags
  const [imageUrls, setImageUrls] = useState([]); // Separate state for image URLs

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getContentByIdForAdmin(contentId);
        setFormData({
          topic: data.topic || '',
          originalText: data.originalText || '',
          videoExplainers: data.videoExplainers || [],
          audioNarrations: data.audioNarrations || [],
          simplifiedVersions: data.simplifiedVersions || [],
          visualMaps: data.visualMaps || [],
        });
        setTags(data.tags || []);
        setImageUrls(data.media?.imageUrls || []);
      } catch (err) {
        setError(err.response?.data?.error || `Failed to fetch content (ID: ${contentId}).`);
        console.error("Fetch content for edit error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (contentId) {
        fetchContent();
    } else {
        setError("Content ID is missing.");
        setLoading(false);
    }
  }, [contentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Handlers for videoExplainers ---
  const handleVideoChange = (index, field, value) => {
    setFormData(prev => ({ ...prev, videoExplainers: prev.videoExplainers.map((video, i) =>
      i === index ? { ...video, [field]: value } : video
    )}));
  };
  const handleAddVideoField = () => {
    setFormData(prev => ({ ...prev, videoExplainers: [...prev.videoExplainers, { source: 'youtube', url: '', title: '', description: '' }]}));
  };
  const handleRemoveVideoField = (index) => {
    setFormData(prev => ({ ...prev, videoExplainers: prev.videoExplainers.filter((_, i) => i !== index)}));
  };

  // --- Handlers for audioNarrations ---
  const handleAudioChange = (index, field, value) => {
    setFormData(prev => ({ ...prev, audioNarrations: prev.audioNarrations.map((audio, i) =>
        i === index ? { ...audio, [field]: value } : audio
    )}));
  };
  const handleAddAudioField = () => {
    setFormData(prev => ({ ...prev, audioNarrations: [...prev.audioNarrations, { language: 'en-US', voice: 'default', url: '' }]}));
  };
  const handleRemoveAudioField = (index) => {
    setFormData(prev => ({ ...prev, audioNarrations: prev.audioNarrations.filter((_, i) => i !== index)}));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.topic || !formData.originalText) {
        setError("Topic and Original Text are required.");
        return;
    }
    setSaving(true);
    setError(null);

    const contentDataToUpdate = {
      topic: formData.topic, // Slug will be updated on backend if topic name changes
      originalText: formData.originalText,
      tags: tags,
      imageUrls: imageUrls.filter(url => url && url.trim() !== ''), // Send only non-empty URLs
      videoExplainers: formData.videoExplainers.filter(video => video.url && video.url.trim() !== ''),
      audioNarrations: formData.audioNarrations.filter(audio => audio.url && audio.url.trim() !== ''),
      // simplifiedVersions and visualMaps are not typically sent for update from admin UI directly
      // They are generated by AI. Admins might have a button to "clear cache" for these instead.
    };

    try {
      await updateContent(contentId, contentDataToUpdate);
      alert('Content updated successfully!'); // Consider using a toast notification
      navigate('/admin/content');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update content.');
      console.error("Update content error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingMessage />;
  // Show error only if not loading and topic is still not set (meaning fetch failed significantly)
  if (error && !formData.topic && !loading) return <ErrorAlert message={error} onBack="/admin/content" />;


  return (
    <div className="space-y-6">
      <div className="mb-2">
        <Link to="/admin/content" className="text-sm"> {/* Relies on global 'a' style */}
          ← Back to Content List
        </Link>
      </div>
      <h1> {/* Uses global H1 style */}
        Edit Content: <span className="capitalize text-[var(--color-link)]">{formData.topic.replace(/-/g,' ') || "Loading topic..."}</span>
      </h1>

      <form onSubmit={handleSubmit} className="card max-w-3xl mx-auto p-6 md:p-8">
        {error && !(!formData.topic && !loading) && <ErrorAlert message={error} /> } {/* Show error here if form is visible but submit failed */}

        <fieldset className="border border-[var(--color-border)] p-4 rounded-md mb-6">
            <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">Core Content</legend>
            <FormField name="topic" label="Topic Title (slug will be auto-generated)" value={formData.topic.replace(/-/g,' ')} onChange={(e) => setFormData(prev => ({...prev, topic: e.target.value}))} required />
            <FormField name="originalText" label="Original Content Text" value={formData.originalText} onChange={handleChange} textarea rows="10" required />
            <TagInput initialTags={tags} onChange={setTags} label="Tags"/>
            <DynamicUrlInput initialUrls={imageUrls} onChange={setImageUrls} label="Image URLs" />
        </fieldset>

        <fieldset className="border border-[var(--color-border)] p-4 rounded-md mb-6">
          <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">Video Explainers</legend>
          {formData.videoExplainers.map((video, index) => (
            <div key={index} className="mb-4 p-3 border border-[var(--color-border)] rounded-md relative bg-[var(--color-background)] shadow-sm dark:bg-slate-800/30 body-theme-high-contrast:bg-gray-900">
              <button
                type="button"
                onClick={() => handleRemoveVideoField(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 bg-white dark:bg-slate-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-500 rounded body-theme-high-contrast:bg-hc-background body-theme-high-contrast:text-red-400 body-theme-high-contrast:border-red-400"
                title="Remove Video"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <FormField name={`videoUrl-${index}`} label="URL" placeholder="https://www.youtube.com/watch?v=..." value={video.url} onChange={(e) => handleVideoChange(index, 'url', e.target.value)} required />
                <FormField name={`videoSource-${index}`} label="Source">
                    <select
                        id={`videoSource-${index}`}
                        value={video.source}
                        onChange={(e) => handleVideoChange(index, 'source', e.target.value)}
                        className="w-full h-full bg-transparent border-none focus:ring-0" // Allows form-input-default on wrapper to style
                    >
                        <option value="youtube">YouTube</option>
                        <option value="vimeo">Vimeo</option>
                        <option value="custom_upload">Custom Upload</option>
                        <option value="generated">AI Generated</option>
                  </select>
                </FormField>
              </div>
              <FormField name={`videoTitle-${index}`} label="Title (optional)" placeholder="Video Title" value={video.title} onChange={(e) => handleVideoChange(index, 'title', e.target.value)} />
              <FormField name={`videoDesc-${index}`} label="Description (brief, optional)" placeholder="Brief description" value={video.description} onChange={(e) => handleVideoChange(index, 'description', e.target.value)} textarea rows="2" />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddVideoField}
            className="button-secondary text-sm"
          >
            + Add Video Explainer
          </button>
        </fieldset>

        <fieldset className="border border-[var(--color-border)] p-4 rounded-md mb-6">
            <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">Audio Narrations (Manual URLs)</legend>
            {formData.audioNarrations.map((audio, index) => (
                <div key={index} className="mb-4 p-3 border border-[var(--color-border)] rounded-md relative bg-[var(--color-background)] shadow-sm dark:bg-slate-800/30 body-theme-high-contrast:bg-gray-900">
                    <button type="button" onClick={() => handleRemoveAudioField(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 bg-white dark:bg-slate-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-500 rounded body-theme-high-contrast:bg-hc-background body-theme-high-contrast:text-red-400 body-theme-high-contrast:border-red-400" title="Remove Audio">Remove</button>
                    <FormField name={`audioUrl-${index}`} label="Audio URL" placeholder="https://example.com/audio.mp3" value={audio.url} onChange={(e) => handleAudioChange(index, 'url', e.target.value)} required />
                </div>
            ))}
            <button type="button" onClick={handleAddAudioField} className="button-secondary text-sm">
                + Add Audio Narration URL
            </button>
        </fieldset>

        {/* --- Read-Only Sections for AI-Generated Content --- */}
        {(formData.simplifiedVersions?.length > 0 || formData.visualMaps?.length > 0) && (
          <div className="space-y-6 mt-6"> {/* Wrapper div for spacing */}
            {formData.simplifiedVersions?.length > 0 && (
              <fieldset className="border border-[var(--color-border)] p-4 rounded-md">
                <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">AI-Generated Simplified Texts</legend>
                {formData.simplifiedVersions.map((version, index) => (
                  <div key={index} className="mb-3 p-3 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] shadow-sm dark:bg-slate-800/30 body-theme-high-contrast:bg-gray-900">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Level: <span className="capitalize font-normal bg-primary/10 text-primary dark:bg-primary-light/20 dark:text-primary-light px-2 py-0.5 rounded-full text-xs body-theme-high-contrast:bg-hc-link body-theme-high-contrast:text-hc-background">{version.level}</span></p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{new Date(version.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="mt-1 p-2 bg-[var(--color-card-background)] border border-[var(--color-border)] rounded max-h-48 overflow-y-auto text-sm">
                    <pre className="whitespace-pre-wrap break-words text-[var(--color-text-primary)]">{version.text}</pre>
                    </div>
                  </div>
                ))}
              </fieldset>
            )}

            {formData.visualMaps?.length > 0 && (
              <fieldset className="border border-[var(--color-border)] p-4 rounded-md">
                <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">AI-Generated Visual Maps</legend>
                {formData.visualMaps.map((vMap, index) => (
                  <div key={index} className="mb-3 p-3 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] shadow-sm dark:bg-slate-800/30 body-theme-high-contrast:bg-gray-900">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Format: <span className="capitalize font-normal bg-secondary/10 text-secondary dark:bg-secondary-light/20 dark:text-secondary-light px-2 py-0.5 rounded-full text-xs body-theme-high-contrast:bg-hc-link body-theme-high-contrast:text-hc-background">{vMap.format}</span></p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{new Date(vMap.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="mt-1 p-2 bg-[var(--color-card-background)] border border-[var(--color-border)] rounded max-h-[400px] overflow-y-auto"> {/* Increased max-h */}
                    {vMap.format === 'mermaid' ? (
                        <MermaidDiagram chartData={vMap.data} diagramId={`admin-map-${contentId}-${index}-${Date.now()}`} /> 
                    ) : (
                        <pre className="text-sm whitespace-pre-wrap break-words text-[var(--color-text-primary)]">{vMap.data}</pre>
                    )}
                    </div>
                    {vMap.notes && <p className="text-xs text-[var(--color-text-secondary)] mt-1 italic">Notes: {vMap.notes}</p>}
                  </div>
                ))}
              </fieldset>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || loading}
          className="button-primary w-full mt-8"
        >
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default AdminEditContentPage;