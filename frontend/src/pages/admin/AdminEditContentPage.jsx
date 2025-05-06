// src/pages/admin/AdminEditContentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getContentByIdForAdmin, updateContent } from '../../services/contentService';
import MermaidDiagram from '../../components/common/MermaidDiagram'; // Adjust path if needed

// Reusable FormField component (can be moved to a common components folder)
const FormField = ({ id, label, type = 'text', value, onChange, required = false, textarea = false, placeholder, disabled = false }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && !disabled && <span className="text-red-500">*</span>}</label>
    {textarea ? (
      <textarea
        id={id}
        name={id}
        rows="10"
        value={value}
        onChange={onChange}
        required={required && !disabled}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
    ) : (
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required && !disabled}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
    )}
  </div>
);


const AdminEditContentPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    topic: '',
    originalText: '',
    tags: '', // Comma-separated string for UI
    imageUrls: '', // Comma-separated string for UI
    videoExplainers: [], // Array of objects: { source, url, title, description }
    audioNarrations: [], // Array of objects: { language, voice, url }
    simplifiedVersions: [], // For display
    visualMaps: [],         // For display
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
        setError(err.response?.data?.error || `Failed to fetch content (ID: ${contentId}) for editing.`);
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

  // --- Handlers for videoExplainers array field ---
  const handleVideoChange = (index, field, value) => {
    const updatedVideos = formData.videoExplainers.map((video, i) =>
      i === index ? { ...video, [field]: value } : video
    );
    setFormData(prev => ({ ...prev, videoExplainers: updatedVideos }));
  };

  const handleAddVideoField = () => {
    setFormData(prev => ({
      ...prev,
      videoExplainers: [
        ...prev.videoExplainers,
        { source: 'youtube', url: '', title: '', description: '' }
      ]
    }));
  };

  const handleRemoveVideoField = (index) => {
    setFormData(prev => ({
      ...prev,
      videoExplainers: prev.videoExplainers.filter((_, i) => i !== index)
    }));
  };

  // --- Handlers for audioNarrations (example if you implement a similar UI) ---
  const handleAudioChange = (index, field, value) => {
    const updatedAudios = formData.audioNarrations.map((audio, i) =>
        i === index ? { ...audio, [field]: value } : audio
    );
    setFormData(prev => ({ ...prev, audioNarrations: updatedAudios }));
  };

  const handleAddAudioField = () => {
    setFormData(prev => ({
        ...prev,
        audioNarrations: [
            ...prev.audioNarrations,
            { language: 'en-US', voice: 'default', url: '' }
        ]
    }));
  };

  const handleRemoveAudioField = (index) => {
    setFormData(prev => ({
        ...prev,
        audioNarrations: prev.audioNarrations.filter((_, i) => i !== index)
    }));
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
      topic: formData.topic,
      originalText: formData.originalText,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      imageUrls: formData.imageUrls ? formData.imageUrls.split(',').map(url => url.trim()).filter(Boolean) : [],
      videoExplainers: formData.videoExplainers.filter(video => video.url && video.url.trim() !== ''),
      audioNarrations: formData.audioNarrations.filter(audio => audio.url && audio.url.trim() !== ''),
      // simplifiedVersions and visualMaps are generally not sent for update from admin UI unless direct edit is intended
    };

    try {
      await updateContent(contentId, contentDataToUpdate);
      alert('Content updated successfully!');
      navigate('/admin/content');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update content.');
      console.error("Update content error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading content details...</div>;
  if (error && !formData.topic) return <div className="p-6 text-center text-red-600 bg-red-50">{error} <Link to="/admin/content" className="text-blue-500 underline">Go back</Link></div>;


  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Link to="/admin/content" className="text-primary hover:underline text-sm">
          ← Back to Content List
        </Link>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">
        Edit Content: <span className="capitalize">{formData.topic || "Loading topic..."}</span>
      </h1>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 md:p-8 shadow-lg rounded-lg">
        {error && <p className="text-red-600 bg-red-100 p-3 rounded mb-4 text-sm">{error}</p>}

        <fieldset className="border border-gray-300 p-4 rounded-md mb-6">
            <legend className="text-lg font-semibold text-gray-700 px-2">Core Content</legend>
            <FormField id="topic" label="Topic Title" value={formData.topic} onChange={handleChange} required />
            <FormField id="originalText" label="Original Content Text" value={formData.originalText} onChange={handleChange} textarea required />
            <FormField id="tags" label="Tags (comma-separated)" value={formData.tags} onChange={handleChange} placeholder="e.g., biology, science, plants" />
            <FormField id="imageUrls" label="Image URLs (comma-separated)" value={formData.imageUrls} onChange={handleChange} placeholder="e.g., https://example.com/image.jpg" />
        </fieldset>

        {/* --- Section for Video Explainers --- */}
        <fieldset className="border border-gray-300 p-4 rounded-md mb-6">
          <legend className="text-lg font-semibold text-gray-700 px-2">Video Explainers</legend>
          {formData.videoExplainers.map((video, index) => (
            <div key={index} className="mb-4 p-3 border border-gray-200 rounded-md relative bg-gray-50">
              <button
                type="button"
                onClick={() => handleRemoveVideoField(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 bg-white border border-red-300 rounded"
                title="Remove Video"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <FormField id={`videoUrl-${index}`} label="URL" placeholder="https://www.youtube.com/watch?v=..." value={video.url} onChange={(e) => handleVideoChange(index, 'url', e.target.value)} required />
                <div>
                  <label htmlFor={`videoSource-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    id={`videoSource-${index}`}
                    value={video.source}
                    onChange={(e) => handleVideoChange(index, 'source', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="custom_upload">Custom Upload</option>
                    <option value="generated">AI Generated</option>
                  </select>
                </div>
              </div>
              <FormField id={`videoTitle-${index}`} label="Title (optional)" placeholder="Video Title" value={video.title} onChange={(e) => handleVideoChange(index, 'title', e.target.value)} />
              <FormField id={`videoDesc-${index}`} label="Description (brief, optional)" placeholder="Brief description" value={video.description} onChange={(e) => handleVideoChange(index, 'description', e.target.value)} textarea />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddVideoField}
            className="mt-2 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium py-2 px-3 rounded-md transition duration-150 border border-green-300"
          >
            + Add Video Explainer
          </button>
        </fieldset>

        {/* --- Section for Audio Narrations (Example Structure) --- */}
        <fieldset className="border border-gray-300 p-4 rounded-md mb-6">
            <legend className="text-lg font-semibold text-gray-700 px-2">Audio Narrations</legend>
            {formData.audioNarrations.map((audio, index) => (
                <div key={index} className="mb-4 p-3 border border-gray-200 rounded-md relative bg-gray-50">
                    <button type="button" onClick={() => handleRemoveAudioField(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 bg-white border border-red-300 rounded" title="Remove Audio">Remove</button>
                    <FormField id={`audioUrl-${index}`} label="Audio URL" placeholder="https://example.com/audio.mp3" value={audio.url} onChange={(e) => handleAudioChange(index, 'url', e.target.value)} required />
                    {/* You could add fields for language and voice if needed */}
                    {/* <FormField id={`audioLang-${index}`} label="Language" value={audio.language} onChange={(e) => handleAudioChange(index, 'language', e.target.value)} /> */}
                </div>
            ))}
            <button type="button" onClick={handleAddAudioField} className="mt-2 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium py-2 px-3 rounded-md transition duration-150 border border-green-300">
                + Add Audio Narration
            </button>
        </fieldset>


        {/* --- Section for AI-Generated Simplified Versions (Read-Only) --- */}
        {formData.simplifiedVersions && formData.simplifiedVersions.length > 0 && (
          <fieldset className="border border-gray-300 p-4 rounded-md mb-6">
            <legend className="text-lg font-semibold text-gray-700 px-2">AI-Generated Simplified Texts</legend>
            {formData.simplifiedVersions.map((version, index) => (
              <div key={index} className="mb-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-semibold text-gray-700">Level: <span className="capitalize font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{version.level}</span></p>
                    <p className="text-xs text-gray-500">Generated: {new Date(version.createdAt).toLocaleString()}</p>
                </div>
                <div className="mt-1 p-2 bg-white border rounded max-h-48 overflow-y-auto text-sm">
                  <pre className="whitespace-pre-wrap break-words">{version.text}</pre>
                </div>
              </div>
            ))}
            {/* Optional: Button to clear cached simplified versions */}
          </fieldset>
        )}

        {/* --- Section for AI-Generated Visual Maps (Read-Only) --- */}
        {formData.visualMaps && formData.visualMaps.length > 0 && (
          <fieldset className="border border-gray-300 p-4 rounded-md mb-6">
            <legend className="text-lg font-semibold text-gray-700 px-2">AI-Generated Visual Maps</legend>
            {formData.visualMaps.map((vMap, index) => (
              <div key={index} className="mb-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-semibold text-gray-700">Format: <span className="capitalize font-normal bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">{vMap.format}</span></p>
                    <p className="text-xs text-gray-500">Generated: {new Date(vMap.createdAt).toLocaleString()}</p>
                </div>
                <div className="mt-1 p-2 bg-white border rounded max-h-96 overflow-y-auto">
                  {vMap.format === 'mermaid' ? (
                    <MermaidDiagram chartData={vMap.data} diagramId={`admin-map-${contentId}-${index}`} />
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap break-words">{vMap.data}</pre>
                  )}
                </div>
                {vMap.notes && <p className="text-xs text-gray-600 mt-1 italic">Notes: {vMap.notes}</p>}
              </div>
            ))}
            {/* Optional: Button to clear cached visual maps */}
          </fieldset>
        )}

        <button
          type="submit"
          disabled={saving || loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-md transition duration-200 disabled:opacity-60"
        >
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default AdminEditContentPage;