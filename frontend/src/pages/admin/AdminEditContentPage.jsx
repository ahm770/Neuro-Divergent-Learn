// src/pages/admin/AdminEditContentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getContentByIdForAdmin, updateContent } from '../../services/contentService';
import MermaidDiagram from '../../components/common/MermaidDiagram';

// Reusable FormField component adapted for theming
const FormField = ({ id, label, type = 'text', value, onChange, required = false, textarea = false, placeholder, disabled = false, name, rows = 3, children }) => (
  <div className="form-field-default"> {/* Using generic wrapper if needed, or just mb-4 */}
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
    ) : children ? ( // For select or other custom inputs
      <div className={`form-input-default p-0 ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}> {/* Remove padding for select */}
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
    <div className="p-6 text-center card"> {/* Using .card */}
        <p className="text-red-600 dark:text-red-400 body-theme-high-contrast:text-hc-link mb-4">{message}</p>
        {onBack && <Link to={onBack} className="button-secondary">Go back</Link>}
    </div>
);


const AdminEditContentPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    topic: '',
    originalText: '',
    tags: '',
    imageUrls: '',
    videoExplainers: [],
    audioNarrations: [],
    simplifiedVersions: [],
    visualMaps: [],
  });

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
          tags: data.tags?.join(', ') || '',
          imageUrls: data.media?.imageUrls?.join(', ') || '',
          videoExplainers: data.videoExplainers || [],
          audioNarrations: data.audioNarrations || [],
          simplifiedVersions: data.simplifiedVersions || [],
          visualMaps: data.visualMaps || [],
        });
      } catch (err) {
        setError(err.response?.data?.error || `Failed to fetch content (ID: ${contentId}).`);
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
    setFormData(prev => ({ ...prev, videoExplainers: prev.videoExplainers.map((v, i) => i === index ? { ...v, [field]: value } : v)}));
  };
  const handleAddVideoField = () => {
    setFormData(prev => ({ ...prev, videoExplainers: [...prev.videoExplainers, { source: 'youtube', url: '', title: '', description: '' }]}));
  };
  const handleRemoveVideoField = (index) => {
    setFormData(prev => ({ ...prev, videoExplainers: prev.videoExplainers.filter((_, i) => i !== index)}));
  };

  // --- Handlers for audioNarrations ---
  const handleAudioChange = (index, field, value) => {
    setFormData(prev => ({ ...prev, audioNarrations: prev.audioNarrations.map((a, i) => i === index ? { ...a, [field]: value } : a)}));
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
    setSaving(true); setError(null);
    const contentDataToUpdate = {
      topic: formData.topic,
      originalText: formData.originalText,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      imageUrls: formData.imageUrls ? formData.imageUrls.split(',').map(url => url.trim()).filter(Boolean) : [],
      videoExplainers: formData.videoExplainers.filter(video => video.url?.trim()),
      audioNarrations: formData.audioNarrations.filter(audio => audio.url?.trim()),
    };
    try {
      await updateContent(contentId, contentDataToUpdate);
      alert('Content updated successfully!'); // Consider a toast notification
      navigate('/admin/content');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update content.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingMessage />;
  if (error && !formData.topic && !loading) return <ErrorAlert message={error} onBack="/admin/content" />;


  return (
    <div className="space-y-6">
      <div className="mb-2"> {/* Reduced margin for tighter layout */}
        <Link to="/admin/content" className="text-sm"> {/* Relies on global 'a' style */}
          ← Back to Content List
        </Link>
      </div>
      <h1> {/* Uses global H1 style */}
        Edit Content: <span className="capitalize text-[var(--color-link)]">{formData.topic || "Loading..."}</span>
      </h1>

      <form onSubmit={handleSubmit} className="card max-w-3xl mx-auto p-6 md:p-8"> {/* Main form card */}
        {error && <ErrorAlert message={error} />} {/* Themed error alert */}

        <fieldset className="border border-[var(--color-border)] p-4 rounded-md mb-6">
            <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">Core Content</legend>
            <FormField name="topic" label="Topic Title" value={formData.topic} onChange={handleChange} required />
            <FormField name="originalText" label="Original Content Text" value={formData.originalText} onChange={handleChange} textarea rows="10" required />
            <FormField name="tags" label="Tags (comma-separated)" value={formData.tags} onChange={handleChange} placeholder="e.g., biology, science" />
            <FormField name="imageUrls" label="Image URLs (comma-separated)" value={formData.imageUrls} onChange={handleChange} placeholder="e.g., https://example.com/image.jpg" />
        </fieldset>

        {/* --- Section for Video Explainers --- */}
        <fieldset className="border border-[var(--color-border)] p-4 rounded-md mb-6">
          <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">Video Explainers</legend>
          {formData.videoExplainers.map((video, index) => (
            <div key={index} className="mb-4 p-3 border border-[var(--color-border)] rounded-md relative bg-[var(--color-background)] shadow-sm dark:bg-slate-800/30 body-theme-high-contrast:bg-gray-900"> {/* Slightly different bg for nested items */}
              <button
                type="button"
                onClick={() => handleRemoveVideoField(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 bg-white dark:bg-slate-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-500 rounded"
                title="Remove Video"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <FormField name={`videoUrl-${index}`} label="URL" placeholder="https://www.youtube.com/watch?v=..." value={video.url} onChange={(e) => handleVideoChange(index, 'url', e.target.value)} required />
                <FormField name={`videoSource-${index}`} label="Source">
                    <select // Select needs to be a child of FormField for proper styling by .form-input-default
                        id={`videoSource-${index}`}
                        value={video.source}
                        onChange={(e) => handleVideoChange(index, 'source', e.target.value)}
                        className="w-full h-full bg-transparent border-none focus:ring-0" // Make select fill the styled div
                    >
                        <option value="youtube">YouTube</option>
                        <option value="vimeo">Vimeo</option>
                        <option value="custom_upload">Custom Upload</option>
                        <option value="generated">AI Generated</option>
                  </select>
                </FormField>
              </div>
              <FormField name={`videoTitle-${index}`} label="Title (optional)" value={video.title} onChange={(e) => handleVideoChange(index, 'title', e.target.value)} />
              <FormField name={`videoDesc-${index}`} label="Description (brief, optional)" value={video.description} onChange={(e) => handleVideoChange(index, 'description', e.target.value)} textarea rows="2" />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddVideoField}
            className="button-secondary text-sm" // Themed button
          >
            + Add Video Explainer
          </button>
        </fieldset>

        {/* --- Section for Audio Narrations --- */}
        <fieldset className="border border-[var(--color-border)] p-4 rounded-md mb-6">
            <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">Audio Narrations (Manual URLs)</legend>
            {formData.audioNarrations.map((audio, index) => (
                <div key={index} className="mb-4 p-3 border border-[var(--color-border)] rounded-md relative bg-[var(--color-background)] shadow-sm dark:bg-slate-800/30 body-theme-high-contrast:bg-gray-900">
                    <button type="button" onClick={() => handleRemoveAudioField(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 bg-white dark:bg-slate-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-500 rounded" title="Remove Audio">Remove</button>
                    <FormField name={`audioUrl-${index}`} label="Audio URL" placeholder="https://example.com/audio.mp3" value={audio.url} onChange={(e) => handleAudioChange(index, 'url', e.target.value)} required />
                    {/* Add fields for language/voice if manually setting, or hide if AI generated */}
                </div>
            ))}
            <button type="button" onClick={handleAddAudioField} className="button-secondary text-sm">
                + Add Audio Narration URL
            </button>
        </fieldset>


        {/* --- Read-Only Sections for AI-Generated Content --- */}
        {(formData.simplifiedVersions?.length > 0 || formData.visualMaps?.length > 0) && (
            <div className="space-y-6">
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
                        <div className="mt-1 p-2 bg-[var(--color-card-background)] border border-[var(--color-border)] rounded max-h-96 overflow-y-auto">
                        {vMap.format === 'mermaid' ? (
                            <MermaidDiagram chartData={vMap.data} diagramId={`admin-map-${contentId}-${index}`} />
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
          className="button-primary w-full mt-8" // Themed button
        >
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default AdminEditContentPage;