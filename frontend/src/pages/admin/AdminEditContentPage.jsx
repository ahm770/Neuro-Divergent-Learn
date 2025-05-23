// src/pages/admin/AdminEditContentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { getContentByIdForEditing, updateContent } from '../../services/contentService'; 
import MermaidDiagram from '../../components/common/MermaidDiagram';
import TagInput from '../../components/admin/TagInput';
import DynamicUrlInput from '../../components/admin/DynamicUrlInput';
import { toast } from 'react-toastify';

const FormField = ({ id, label, type = 'text', value, onChange, required = false, textarea = false, placeholder, disabled = false, name, rows = 3, children }) => (
  <div className="form-field-default">
    <label htmlFor={id || name} className="form-label-default">{label}{required && !disabled && <span className="text-red-500 ml-1">*</span>}</label>
    {textarea ? (
      <textarea id={id || name} name={name || id} rows={rows} value={value} onChange={onChange} required={required && !disabled} placeholder={placeholder} disabled={disabled} className={`form-input-default ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}/>
    ) : children ? (
      <div className={`form-input-default p-0 ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}>{children}</div>
    ) : (
      <input type={type} id={id || name} name={name || id} value={value} onChange={onChange} required={required && !disabled} placeholder={placeholder} disabled={disabled} className={`form-input-default ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}/>
    )}
  </div>
);

const LoadingMessage = () => <div className="p-6 text-center text-[var(--color-text-secondary)]">Loading content details...</div>;

const PageLoadError = ({ message, basePath }) => ( // Added basePath
    <div className="p-6 text-center card my-4">
        <p className="text-red-600 dark:text-red-400 body-theme-high-contrast:text-hc-link mb-4">{message}</p>
        <Link to={`${basePath}/content`} className="button-secondary text-sm">Go back to list</Link>
    </div>
);


const AdminEditContentPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    topicSlug: '', // Store the slug separately from display title
    displayTopic: '', // For the input field
    originalText: '',
    videoExplainers: [],
    audioNarrations: [],
    simplifiedVersions: [],
    visualMaps: [],
  });
  const [tags, setTags] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [initialImageGallery, setInitialImageGallery] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const basePath = window.location.pathname.startsWith('/admin') ? '/admin' : '/creator';

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const data = await getContentByIdForEditing(contentId);
        setFormData({
          topicSlug: data.topic || '', // This is the slug from DB
          displayTopic: data.topic ? data.topic.replace(/-/g, ' ') : '', // Convert slug to human-readable for display
          originalText: data.originalText || '',
          videoExplainers: data.videoExplainers || [],
          audioNarrations: data.audioNarrations || [],
          simplifiedVersions: data.simplifiedVersions || [],
          visualMaps: data.visualMaps || [],
        });
        setTags(data.tags || []);
        const fetchedImageUrls = data.media?.imageUrls || [];
        setImageUrls(fetchedImageUrls);
        setInitialImageGallery(fetchedImageUrls);
      } catch (err) {
        const fetchErrorMsg = err.response?.data?.error || `Failed to fetch content (ID: ${contentId}).`;
        toast.error(fetchErrorMsg);
      } finally {
        setLoading(false);
      }
    };
    if (contentId) {
        fetchContent();
    } else {
        toast.error("Content ID is missing.");
        setLoading(false);
        navigate(`${basePath}/content`);
    }
  }, [contentId, basePath, navigate]);

  const handleDisplayTopicChange = (e) => {
    const newDisplayTopic = e.target.value;
    setFormData(prev => ({ 
        ...prev, 
        displayTopic: newDisplayTopic,
        // topicSlug will be updated on submit based on displayTopic, or backend handles slug generation
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleArrayChange = (setterFunc, fieldData) => setterFunc(fieldData);
  const handleVideoChange = (index, field, value) => handleArrayChange(setFormData, prev => ({ ...prev, videoExplainers: prev.videoExplainers.map((video, i) => i === index ? { ...video, [field]: value } : video)}));
  const handleAddVideoField = () => handleArrayChange(setFormData, prev => ({ ...prev, videoExplainers: [...prev.videoExplainers, { source: 'youtube', url: '', title: '', description: '' }]}));
  const handleRemoveVideoField = (index) => handleArrayChange(setFormData, prev => ({ ...prev, videoExplainers: prev.videoExplainers.filter((_, i) => i !== index)}));
  const handleAudioChange = (index, field, value) => handleArrayChange(setFormData, prev => ({ ...prev, audioNarrations: prev.audioNarrations.map((audio, i) => i === index ? { ...audio, [field]: value } : audio)}));
  const handleAddAudioField = () => handleArrayChange(setFormData, prev => ({ ...prev, audioNarrations: [...prev.audioNarrations, { language: 'en-US', voice: 'default', url: '' }]}));
  const handleRemoveAudioField = (index) => handleArrayChange(setFormData, prev => ({ ...prev, audioNarrations: prev.audioNarrations.filter((_, i) => i !== index)}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.displayTopic || !formData.originalText) {
        toast.error("Topic Title and Original Text are required.");
        return;
    }
    setSaving(true);

    const contentDataToUpdate = {
      // Send the human-readable title; backend will re-slugify it.
      // This allows users to change the human-readable title naturally.
      topic: formData.displayTopic.trim(), 
      originalText: formData.originalText,
      tags: tags,
      imageUrls: imageUrls.filter(url => url && url.trim() !== ''),
      videoExplainers: formData.videoExplainers.filter(video => video.url && video.url.trim() !== ''),
      audioNarrations: formData.audioNarrations.filter(audio => audio.url && audio.url.trim() !== ''),
    };

    try {
      const updatedContent = await updateContent(contentId, contentDataToUpdate);
      toast.success('Content updated successfully!');
      if (updatedContent) {
        setFormData(prev => ({
            ...prev,
            topicSlug: updatedContent.topic || prev.topicSlug,
            displayTopic: updatedContent.topic ? updatedContent.topic.replace(/-/g, ' ') : prev.displayTopic,
            originalText: updatedContent.originalText || prev.originalText,
            videoExplainers: updatedContent.videoExplainers || [],
            audioNarrations: updatedContent.audioNarrations || [],
            simplifiedVersions: updatedContent.simplifiedVersions || [],
            visualMaps: updatedContent.visualMaps || [],
        }));
        const updatedImageUrls = updatedContent.media?.imageUrls || [];
        setTags(updatedContent.tags || []);
        setImageUrls(updatedImageUrls);
        setInitialImageGallery(updatedImageUrls);
      }
    } catch (err) {
      const updateErrorMsg = err.response?.data?.error || 'Failed to update content.';
      toast.error(updateErrorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !formData.displayTopic) return <LoadingMessage />;
  if (!loading && !formData.displayTopic && contentId) {
      return <PageLoadError message={`Failed to load content with ID: ${contentId}. It might have been deleted or an error occurred.`} basePath={basePath} />
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center mb-2">
        <Link to={`${basePath}/content`} className="text-sm hover:underline text-[var(--color-link)]">
            ← Back to Content List
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Edit Content: <span className="capitalize text-[var(--color-link)]">{formData.displayTopic || "Loading..."}</span></h1>

      <form onSubmit={handleSubmit} className="card max-w-3xl mx-auto p-6 md:p-8">
        <fieldset className="border border-[var(--color-border)] p-4 rounded-md mb-6">
            <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">Core Content</legend>
            <FormField 
              name="displayTopic"
              label="Topic Title (human-readable)" 
              value={formData.displayTopic} // Use displayTopic for input
              onChange={handleDisplayTopicChange} // Use specific handler
              required 
              placeholder="e.g. Photosynthesis For Beginners"
            />
            <FormField name="originalText" label="Original Content Text" value={formData.originalText} onChange={handleChange} textarea rows="10" required />
            <TagInput 
              initialTags={tags} 
              onChange={(newTags) => handleArrayChange(setTags, newTags)} 
              label="Tags"
            />
            <DynamicUrlInput
              initialUrls={imageUrls} 
              onChange={(newUrls) => handleArrayChange(setImageUrls, newUrls)} 
              label="Image URLs (Editable)" 
            />
        </fieldset>

        {initialImageGallery && initialImageGallery.length > 0 && (
            <fieldset className="border border-[var(--color-border)] p-4 rounded-md mb-6">
                <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">Current Saved Images</legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                    {initialImageGallery.map((url, index) => (
                        url && typeof url === 'string' && url.trim() !== '' ? (
                            <div key={`gallery-${index}-${url}`} className="aspect-square bg-[var(--color-border)] rounded overflow-hidden shadow">
                                <img 
                                    src={url} 
                                    alt={`Saved content image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => { e.target.style.display='none'; if(e.target.parentElement) e.target.parentElement.innerHTML='<span class="text-xs p-1 text-red-500">Load Error</span>';}}
                                />
                            </div>
                        ) : null
                    ))}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                    To change images, edit the "Image URLs (Editable)" section above and save. New images will appear here after saving.
                </p>
            </fieldset>
        )}

        <fieldset className="border border-[var(--color-border)] p-4 rounded-md mb-6">
          <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">Video Explainers</legend>
           {formData.videoExplainers.map((video, index) => (
            <div key={index} className="mb-4 p-3 border border-[var(--color-border)] rounded-md relative bg-[var(--color-background)] shadow-sm dark:bg-slate-800/30 body-theme-high-contrast:bg-gray-900">
              <button type="button" onClick={() => handleRemoveVideoField(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 bg-white dark:bg-slate-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-500 rounded body-theme-high-contrast:bg-hc-background body-theme-high-contrast:text-red-400 body-theme-high-contrast:border-red-400" title="Remove Video">Remove</button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <FormField name={`videoUrl-${index}`} label="URL" value={video.url} onChange={(e) => handleVideoChange(index, 'url', e.target.value)} required />
                <FormField name={`videoSource-${index}`} label="Source">
                    <select id={`videoSource-${index}`} value={video.source} onChange={(e) => handleVideoChange(index, 'source', e.target.value)} className="w-full h-full bg-transparent border-none focus:ring-0 form-select">
                        <option value="youtube">YouTube</option> <option value="vimeo">Vimeo</option> <option value="custom_upload">Custom Upload</option> <option value="generated">AI Generated</option>
                  </select>
                </FormField>
              </div>
              <FormField name={`videoTitle-${index}`} label="Title (optional)" value={video.title} onChange={(e) => handleVideoChange(index, 'title', e.target.value)} />
              <FormField name={`videoDesc-${index}`} label="Description (brief, optional)" value={video.description} onChange={(e) => handleVideoChange(index, 'description', e.target.value)} textarea rows="2" />
            </div>
          ))}
          <button type="button" onClick={handleAddVideoField} className="button-secondary text-sm">+ Add Video Explainer</button>
        </fieldset>

        <fieldset className="border border-[var(--color-border)] p-4 rounded-md mb-6">
            <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">Audio Narrations (Manual URLs)</legend>
            {formData.audioNarrations.map((audio, index) => (
                <div key={index} className="mb-4 p-3 border border-[var(--color-border)] rounded-md relative bg-[var(--color-background)] shadow-sm dark:bg-slate-800/30 body-theme-high-contrast:bg-gray-900">
                    <button type="button" onClick={() => handleRemoveAudioField(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 bg-white dark:bg-slate-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-500 rounded body-theme-high-contrast:bg-hc-background body-theme-high-contrast:text-red-400 body-theme-high-contrast:border-red-400" title="Remove Audio">Remove</button>
                    <FormField name={`audioUrl-${index}`} label="Audio URL" value={audio.url} onChange={(e) => handleAudioChange(index, 'url', e.target.value)} required />
                </div>
            ))}
            <button type="button" onClick={handleAddAudioField} className="button-secondary text-sm">+ Add Audio Narration URL</button>
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                Note: AI-generated audio is handled via the "Audio" mode on the content consumption page. These fields are for manually added URLs.
            </p>
        </fieldset>
        
         {(formData.simplifiedVersions?.length > 0 || formData.visualMaps?.length > 0) && (
          <div className="space-y-6 mt-6">
            {formData.simplifiedVersions?.length > 0 && (
              <fieldset className="border border-[var(--color-border)] p-4 rounded-md">
                <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">AI-Generated Simplified Texts</legend>
                {formData.simplifiedVersions.map((version, index) => (
                  <div key={`simple-${index}-${version.level}`} className="mb-3 p-3 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] shadow-sm dark:bg-slate-800/30 body-theme-high-contrast:bg-gray-900">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Level: <span className="capitalize font-normal bg-primary/10 text-primary dark:bg-primary-light/20 dark:text-primary-light px-2 py-0.5 rounded-full text-xs body-theme-high-contrast:bg-hc-link body-theme-high-contrast:text-hc-background">{version.level}</span></p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{new Date(version.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="mt-1 p-2 bg-[var(--color-card-background)] border border-[var(--color-border)] rounded max-h-48 overflow-y-auto text-sm">
                    <pre className="whitespace-pre-wrap break-words text-[var(--color-text-primary)]">{version.text}</pre>
                    </div>
                  </div>
                ))}
                 <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                    These are generated on-demand by users/AI via the content consumption page. They are displayed here for review.
                </p>
              </fieldset>
            )}

            {formData.visualMaps?.length > 0 && (
              <fieldset className="border border-[var(--color-border)] p-4 rounded-md">
                <legend className="text-lg font-semibold text-[var(--color-text-secondary)] px-2">AI-Generated Visual Maps</legend>
                {formData.visualMaps.map((vMap, index) => (
                  <div key={`vmap-${index}-${vMap.format}`} className="mb-3 p-3 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] shadow-sm dark:bg-slate-800/30 body-theme-high-contrast:bg-gray-900">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Format: <span className="capitalize font-normal bg-secondary/10 text-secondary dark:bg-secondary-light/20 dark:text-secondary-light px-2 py-0.5 rounded-full text-xs body-theme-high-contrast:bg-hc-link body-theme-high-contrast:text-hc-background">{vMap.format}</span></p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{new Date(vMap.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="mt-1 p-2 bg-[var(--color-card-background)] border border-[var(--color-border)] rounded max-h-[400px] overflow-y-auto">
                    {vMap.format === 'mermaid' ? (
                        <MermaidDiagram chartData={vMap.data} diagramId={`admin-map-${contentId}-${index}-${new Date(vMap.createdAt).getTime()}`} />  
                    ) : (
                        <pre className="text-sm whitespace-pre-wrap break-words text-[var(--color-text-primary)]">{vMap.data}</pre>
                    )}
                    </div>
                    {vMap.notes && <p className="text-xs text-[var(--color-text-secondary)] mt-1 italic">Notes: {vMap.notes}</p>}
                  </div>
                ))}
                 <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                    Generated on-demand by users/AI. Displayed for review.
                </p>
              </fieldset>
            )}
          </div>
        )}

        <button type="submit" disabled={saving || loading} className="button-primary w-full mt-8">
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default AdminEditContentPage;