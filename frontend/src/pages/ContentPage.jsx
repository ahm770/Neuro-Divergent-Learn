// src/pages/ContentPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getContentByTopic,
  simplifyContent,
  generateVisualMap,
  generateAudioNarration
} from '../services/contentService';
import MermaidDiagram from '../components/common/MermaidDiagram';

// --- Inlined Placeholder Components (Ideally, these are separate files) ---
const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="text-center p-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-link)] mx-auto mb-2"></div>
    <p className="text-[var(--color-text-secondary)]">{text}</p>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div
    className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded
               dark:bg-red-900/30 dark:border-red-600 dark:text-red-300
               body-theme-high-contrast:bg-hc-background body-theme-high-contrast:border-hc-link body-theme-high-contrast:text-hc-link"
    role="alert"
  >
    <p className="font-bold">Error</p>
    <p>{message}</p>
  </div>
);

const InfoMessage = ({ message }) => (
  <div
    className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 my-4 rounded
               dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300
               body-theme-high-contrast:bg-hc-background body-theme-high-contrast:border-hc-link body-theme-high-contrast:text-hc-link"
    role="alert"
  >
    <p>{message}</p>
  </div>
);
// --- End Placeholder Components ---


const ContentPage = () => {
  const { topic } = useParams();
  const { user } = useAuth();
  const userPrefs = user?.preferences;

  const [content, setContent] = useState(null);
  const [currentMode, setCurrentMode] = useState('original');
  const [displayedText, setDisplayedText] = useState('');
  const [visualMapData, setVisualMapData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingMode, setIsProcessingMode] = useState(false);

  // For on-page image toggle (optional, advanced UX)
  // const [showImagesOverride, setShowImagesOverride] = useState(null); 

  const fetchContentData = useCallback(async () => {
    if (!topic) return;
    setLoading(true);
    setError(null); setContent(null); setDisplayedText(''); setVisualMapData(null); setAudioUrl(null); setCurrentMode('original');
    try {
      const data = await getContentByTopic(topic);
      setContent(data);
      console.log("Fetched Content Data:", data);
      setDisplayedText(data.originalText);

      if (userPrefs?.preferredContentMode) {
        const prefMode = userPrefs.preferredContentMode;
        const readingLevelCacheKey = userPrefs.readingLevel === 'basic' ? 'easy' : (userPrefs.readingLevel === 'advanced' ? 'advanced' : 'moderate');
        
        if (prefMode === 'simplified' && data.simplifiedVersions?.length > 0) {
           const version = data.simplifiedVersions.find(v => v.level === readingLevelCacheKey) || data.simplifiedVersions[0];
           if(version) { setDisplayedText(version.text); setCurrentMode('simplified'); }
        } else if (prefMode === 'visual' && data.visualMaps?.length > 0) {
            setVisualMapData(data.visualMaps[0]); setCurrentMode('visual');
        } else if (prefMode === 'audio' && data.audioNarrations?.length > 0) {
            setAudioUrl(data.audioNarrations[0].url); setCurrentMode('audio');
        }
      }
    } catch (err) { 
        setError(err.response?.data?.message || `Content for "${topic}" not found or failed to load.`);
        console.error("Fetch content error:", err);
    }
    finally { setLoading(false); }
  }, [topic, userPrefs]);

  useEffect(() => { fetchContentData(); }, [fetchContentData]);

  const handleModeChange = useCallback(async (mode, params = {}) => {
    setError(null);
    if (mode === currentMode && mode !== 'simplified') return;

    setCurrentMode(mode);
    setIsProcessingMode(true);
    setVisualMapData(null); 
    setAudioUrl(null);     
    
    try {
      if (!content) { setError("Content not loaded yet."); setIsProcessingMode(false); return; }

      if (mode === 'original') {
        setDisplayedText(content.originalText);
      } else if (mode === 'simplified') {
        const level = params.level || (userPrefs?.readingLevel === 'basic' ? 'easy' : (userPrefs?.readingLevel === 'advanced' ? 'advanced' : 'moderate'));
        const cachedVersion = content.simplifiedVersions?.find(v => v.level === level);
        if (cachedVersion) {
          setDisplayedText(cachedVersion.text);
        } else {
          const simplifiedData = await simplifyContent(content.topic, level);
          setDisplayedText(simplifiedData.simplifiedText);
          setContent(prev => ({...prev, simplifiedVersions: [...(prev.simplifiedVersions || []), {level, text: simplifiedData.simplifiedText, createdAt: new Date()}]}));
        }
      } else if (mode === 'visual') {
        setDisplayedText(''); 
        const format = 'mermaid'; 
        const cachedMap = content.visualMaps?.find(v => v.format === format);
        if (cachedMap) {
            setVisualMapData(cachedMap);
        } else {
            const mapData = await generateVisualMap(content.topic, format);
            setVisualMapData(mapData.visualMap);
            setContent(prev => ({...prev, visualMaps: [...(prev.visualMaps || []), mapData.visualMap]}));
        }
      } else if (mode === 'audio') {
        setDisplayedText(''); 
        const readingLevelCacheKey = userPrefs?.readingLevel === 'basic' ? 'easy' : (userPrefs?.readingLevel === 'advanced' ? 'advanced' : 'moderate');
        const textForAudio = content.simplifiedVersions?.find(v => v.level === readingLevelCacheKey)?.text || content.originalText;
        const cachedAudio = content.audioNarrations?.[0]; 
        if(cachedAudio) { 
            setAudioUrl(cachedAudio.url); 
        } else if (textForAudio) {
            const narrationData = await generateAudioNarration(content._id, textForAudio);
            setAudioUrl(narrationData.narration.url);
            setContent(prev => ({...prev, audioNarrations: [...(prev.audioNarrations || []), narrationData.narration]}));
        } else { 
            setError("No text available to narrate.");
        }
      }
    } catch (err) {
      console.error(`Failed to switch to ${mode} mode:`, err);
      setError(err.response?.data?.error || `Failed to generate ${mode} content.`);
    } finally {
      setIsProcessingMode(false);
    }
  }, [content, currentMode, userPrefs]);

  const getProseClass = () => userPrefs?.theme === 'high-contrast' ? 'prose-high-contrast' : '';

  const getButtonClass = (modeNameIsCurrent) => {
    let base = "px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ";
    if (modeNameIsCurrent) {
        if (userPrefs?.theme === 'high-contrast') return base + "bg-hc-interactive text-hc-interactive-text";
        return base + "bg-primary text-white dark:bg-primary-light dark:text-slate-900 shadow-md";
    } else {
        if (userPrefs?.theme === 'high-contrast') return base + "bg-hc-background text-hc-text border border-hc-border hover:bg-gray-800";
        return base + "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200";
    }
  };

  const imageUrlsToDisplay = content?.media?.imageUrls || [];
  
  // --- Image Display Preferences ---
  // For showImages: 'all', 'none' (or boolean 'showContentImages')
  // For imageLayout: 'stacked', 'grid'
  const showImagesPreference = userPrefs?.showContentImages !== undefined ? userPrefs.showContentImages : true; // Default to true if not set
  // let showImages = showImagesOverride !== null ? showImagesOverride : showImagesPreference;
  let showImages = showImagesPreference; // Simplified for now, without on-page override

  const imageLayoutPreference = userPrefs?.imageLayout || 'stacked'; // Default to 'stacked'

  if (loading) return <LoadingSpinner text={`Loading ${topic.replace(/-/g, ' ')}...`} />;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-4">
        <Link to="/dashboard" className="text-sm">← Back to Dashboard</Link>
      </div>

      {error && <ErrorMessage message={error} />}
      {!content && !loading && !error && <InfoMessage message={`No content found for "${topic}".`} />}

      {content && (
        <div className="space-y-8"> {/* Main content wrapper for spacing */}
          <h1 className="capitalize">{content.topic.replace(/-/g, ' ')}</h1>
          
          {/* Main Content Area (Text, Mermaid, Audio) */}
          <div className="mb-8"> {/* Spacing after main content before images */}
            <div className="mb-6 border-b pb-3 flex flex-wrap gap-2 items-center border-[var(--color-border)]">
              {['original', 'simplified', 'visual', 'audio'].map((modeName) => (
                <button
                  key={modeName}
                  onClick={() => handleModeChange(modeName)}
                  disabled={isProcessingMode && currentMode !== modeName && modeName !== 'original'}
                  className={getButtonClass(currentMode === modeName)}
                >
                  {isProcessingMode && currentMode === modeName ? `Loading...` : modeName.charAt(0).toUpperCase() + modeName.slice(1)}
                </button>
              ))}
              {currentMode === 'simplified' && (
                  <select
                      value={userPrefs?.readingLevel === 'basic' ? 'easy' : (userPrefs?.readingLevel === 'advanced' ? 'advanced' : 'moderate')}
                      onChange={(e) => handleModeChange('simplified', { level: e.target.value })}
                      disabled={isProcessingMode}
                      className="form-input-default ml-2 px-2 py-1.5 text-sm !w-auto"
                  >
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="advanced">Advanced</option>
                  </select>
              )}
            </div>

            <article
              className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none 
                          p-4 md:p-6 border rounded shadow-sm 
                          bg-[var(--color-card-background)] border-[var(--color-border)]
                          dark:prose-invert ${getProseClass()}`}
            >
              {(currentMode === 'original' || currentMode === 'simplified') && (
                   isProcessingMode && !displayedText ? <LoadingSpinner text={currentMode === 'original' ? 'Loading...' : 'Simplifying...'} /> :
                   displayedText ? <div dangerouslySetInnerHTML={{ __html: displayedText.replace(/\n/g, '<br />') }} /> :
                   !isProcessingMode && <InfoMessage message="No text content available." />
              )}
              {currentMode === 'visual' && (
                   isProcessingMode && !visualMapData ? <LoadingSpinner text="Generating visual map..." /> :
                   visualMapData && visualMapData.data && visualMapData.format === 'mermaid' ? (
                       <MermaidDiagram chartData={visualMapData.data} diagramId={`content-map-${content._id}-${Date.now()}`} />
                   ) :
                   visualMapData && visualMapData.data && visualMapData.format !== 'mermaid' ? (
                        <pre className="whitespace-pre-wrap break-words">{visualMapData.data}</pre>
                   ) :
                   !isProcessingMode && <InfoMessage message="No visual map available or format not supported." />
              )}
              {currentMode === 'audio' && (
                   isProcessingMode && !audioUrl ? <LoadingSpinner text="Generating audio..." /> :
                   audioUrl ? <audio controls src={audioUrl} className="w-full my-2 body-theme-high-contrast:[color-scheme:dark]">Your browser does not support audio.</audio> :
                   !isProcessingMode && <InfoMessage message="No audio available." />
              )}
            </article>
          </div>
          {/* End Main Content Area */}


          {/* --- IMAGE DISPLAY SECTION --- */}
          {showImages && imageUrlsToDisplay && imageUrlsToDisplay.length > 0 && (
            <section className="my-8 py-6 border-t border-b border-[var(--color-border)]" aria-labelledby="illustrations-heading">
              <h2 id="illustrations-heading" className="text-xl font-semibold mb-6 text-center text-[var(--color-text-secondary)]">
                Illustrations / Visual Aids
              </h2>
              
              <div 
                className={`
                  ${imageLayoutPreference === 'grid' ? 
                    'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6' : 
                    'space-y-6 max-w-2xl mx-auto' // Stacked layout
                  }
                `}
              >
                {imageUrlsToDisplay.map((url, index) => (
                  url && typeof url === 'string' && url.trim() !== '' ? (
                    <figure 
                        key={`content-image-${index}-${url}`} 
                        className="bg-[var(--color-card-background)] rounded-lg overflow-hidden shadow-lg border border-[var(--color-border)] group" // group for hover effect
                    >
                      <img
                        src={url}
                        alt={`${content.topic.replace(/-/g, ' ')} illustration ${index + 1}`}
                        className={`w-full block mx-auto transition-transform duration-300 group-hover:scale-105
                          ${imageLayoutPreference === 'grid' ? 
                            'h-full object-cover aspect-[16/10]' : // For grid, cover and aspect ratio
                            'h-auto max-h-[60vh] object-contain' // For stacked, contain and max height
                          } 
                        `}
                        loading="lazy"
                        onError={(e) => {
                          console.warn(`Error loading image: ${url}`);
                          e.target.style.display = 'none';
                          if(e.target.parentElement) {
                            const errorP = document.createElement('p');
                            errorP.className = 'text-xs text-red-500 p-4 text-center';
                            errorP.textContent = 'Image failed to load';
                            e.target.parentElement.appendChild(errorP);
                          }
                        }}
                      />
                      {/* Example for caption if you add caption data to your content model */}
                      {/* {content.media.imageCaptions && content.media.imageCaptions[index] && (
                        <figcaption className="p-3 text-sm text-center text-[var(--color-text-secondary)] bg-[var(--color-background)] border-t border-[var(--color-border)]">
                          {content.media.imageCaptions[index]}
                        </figcaption>
                      )} */}
                    </figure>
                  ) : null
                ))}
              </div>
            </section>
          )}
          {/* --- END IMAGE DISPLAY SECTION --- */}

          <div className="mt-8 card">
            <h3 className="text-xl font-semibold mb-3">Interactive Companion</h3>
            <p className="text-[var(--color-text-secondary)]">Ask questions and get personalized help related to this topic (Coming Soon).</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPage;