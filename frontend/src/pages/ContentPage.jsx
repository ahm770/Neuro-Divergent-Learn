// ===== File: /src/pages/ContentPage.jsx =====
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getContentByTopic,
  simplifyContent,
  generateVisualMap,
  // generateAudioNarration // Still placeholder-like based on backend
} from '../services/contentService';
import { logContentInteractionApi } from '../services/taskService';
import { askQuestionApi } from '../services/qaService'; // For Q&A
import MermaidDiagram from '../components/common/MermaidDiagram';
import { toast } from 'react-toastify';

// --- Inlined Placeholder Components ---
const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="text-center p-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-link)] mx-auto mb-2"></div>
    <p className="text-[var(--color-text-secondary)]">{text}</p>
  </div>
);
const ErrorMessageDisplay = ({ message }) => ( // Renamed to avoid conflict
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
const InfoMessageDisplay = ({ message }) => ( // Renamed
  <div
    className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 my-4 rounded
               dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300
               body-theme-high-contrast:bg-hc-background body-theme-high-contrast:border-hc-link body-theme-high-contrast:text-hc-link"
    role="alert"
  >
    <p>{message}</p>
  </div>
);

// Granular simplification levels for UI
const SIMPLIFICATION_LEVELS = [
    { value: 'eli5', label: 'ELI5 (Simplest)' },
    { value: 'easy', label: 'Easy' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'high_school', label: 'High School' },
    { value: 'college_intro', label: 'College Intro' },
    // { value: 'advanced', label: 'Advanced' }, // Can add if needed
];

// Map user preference reading levels to one of the granular cache keys
const mapUserPrefToCacheKey = (prefLevel) => {
    switch (prefLevel) {
        case 'basic': return 'easy';
        case 'intermediate': return 'moderate';
        case 'advanced': return 'advanced'; // Or map to 'college_intro' if 'advanced' isn't a direct AI target
        default: return 'easy';
    }
};


const ContentPage = () => {
  const { topic: topicSlug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const userPrefs = user?.preferences;

  const [contentAndProgress, setContentAndProgress] = useState(null); // Stores { ...content, learningProgress }
  const [currentMode, setCurrentMode] = useState('original');
  const [displayedText, setDisplayedText] = useState('');
  const [visualMapData, setVisualMapData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingMode, setIsProcessingMode] = useState(false);
  const [selectedSimplificationLevel, setSelectedSimplificationLevel] = useState('');

  const interactionStartTimeRef = useRef(null);
  const currentContentIdRef = useRef(null);
  const currentModeRef = useRef('original'); // Ref to hold currentMode for reliable logging on unmount

  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState('');


  const logInteraction = useCallback(async (eventType, modeOverride = null, explicitDurationMs = null) => {
    if (!isAuthenticated || !currentContentIdRef.current) return;

    const modeToLog = modeOverride || currentModeRef.current;
    let durationMs = explicitDurationMs;

    if (eventType === 'end' && interactionStartTimeRef.current && explicitDurationMs === null) {
        durationMs = Date.now() - interactionStartTimeRef.current;
    }

    if (eventType === 'end' && (durationMs === null || durationMs < 1500) && explicitDurationMs === null) {
        interactionStartTimeRef.current = null;
        return; // Skip logging very short interactions
    }

    try {
      await logContentInteractionApi({
        contentId: currentContentIdRef.current,
        mode: modeToLog,
        eventType,
        durationMs: eventType === 'end' ? durationMs : undefined,
      });
      if (eventType === 'start') {
        interactionStartTimeRef.current = Date.now();
      } else if (eventType === 'end') {
        interactionStartTimeRef.current = null;
      }
    } catch (loggingError) {
      console.warn('Failed to log content interaction:', loggingError.message);
    }
  }, [isAuthenticated]);

  const fetchContentData = useCallback(async () => {
    if (!topicSlug) return;
    setLoading(true);
    setError(null); setContentAndProgress(null); setDisplayedText(''); setVisualMapData(null); setAudioUrl(null);
    setCurrentMode('original'); currentModeRef.current = 'original';
    setSelectedSimplificationLevel(mapUserPrefToCacheKey(userPrefs?.readingLevel || 'easy'));

    try {
      const data = await getContentByTopic(topicSlug);
      setContentAndProgress(data);
      currentContentIdRef.current = data._id;
      setDisplayedText(data.originalText);

      let initialMode = userPrefs?.preferredContentMode || 'original';
      if (initialMode === 'simplified' && data.defaultSimplifiedText) {
          setSelectedSimplificationLevel(data.defaultSimplifiedLevel || mapUserPrefToCacheKey(userPrefs?.readingLevel || 'easy'));
          setDisplayedText(data.defaultSimplifiedText);
          setCurrentMode('simplified'); currentModeRef.current = 'simplified';
      } else if (initialMode === 'visual' && data.visualMaps?.length > 0) {
          setVisualMapData(data.visualMaps.find(m => m.format === 'mermaid') || data.visualMaps[0]);
          setCurrentMode('visual'); currentModeRef.current = 'visual';
      } else if (initialMode === 'audio' && data.audioNarrations?.length > 0) {
          setAudioUrl(data.audioNarrations[0].url);
          setCurrentMode('audio'); currentModeRef.current = 'audio';
      } else {
          setCurrentMode('original'); currentModeRef.current = 'original';
      }
      logInteraction('start', currentModeRef.current);
    } catch (err) {
      const errMsg = err.response?.data?.message || `Content for "${topicSlug}" not found or failed to load.`;
      setError(errMsg);
      toast.error(errMsg);
      if(err.response?.status === 404) navigate('/dashboard'); // Or a 404 page
    } finally {
      setLoading(false);
    }
  }, [topicSlug, userPrefs, logInteraction, navigate]);

  useEffect(() => {
    fetchContentData();
    return () => {
      logInteraction('end');
      currentContentIdRef.current = null;
    };
  }, [fetchContentData]); // fetchContentData includes logInteraction


  const handleModeChange = useCallback(async (newMode, params = {}) => {
    if (!contentAndProgress) return;
    setError(null);

    const previousModeDuration = interactionStartTimeRef.current ? Date.now() - interactionStartTimeRef.current : null;
    await logInteraction('end', currentModeRef.current, previousModeDuration);

    setCurrentMode(newMode); currentModeRef.current = newMode;
    setIsProcessingMode(true);
    if (newMode !== 'visual') setVisualMapData(null);
    if (newMode !== 'audio') setAudioUrl(null);

    await logInteraction('start', newMode);

    try {
      if (newMode === 'original') {
        setDisplayedText(contentAndProgress.originalText);
      } else if (newMode === 'simplified') {
        const levelToSimplify = params.level || selectedSimplificationLevel || mapUserPrefToCacheKey(userPrefs?.readingLevel || 'easy');
        setSelectedSimplificationLevel(levelToSimplify);

        const cachedVersion = contentAndProgress.simplifiedVersions?.find(v => v.level === levelToSimplify);
        if (cachedVersion) {
          setDisplayedText(cachedVersion.text);
        } else {
          toast.info(`Generating ${levelToSimplify} simplification...`);
          const simplifiedResult = await simplifyContent(contentAndProgress.topic, levelToSimplify);
          setDisplayedText(simplifiedResult.simplifiedText);
          setContentAndProgress(prev => ({
            ...prev,
            simplifiedVersions: [...(prev.simplifiedVersions || []), { level: simplifiedResult.level, text: simplifiedResult.simplifiedText, createdAt: new Date() }]
          }));
        }
      } else if (newMode === 'visual') {
        setDisplayedText('');
        const format = 'mermaid';
        const cachedMap = contentAndProgress.visualMaps?.find(v => v.format === format);
        if (cachedMap) {
          setVisualMapData(cachedMap);
        } else {
          toast.info("Generating visual map...");
          const mapResult = await generateVisualMap(contentAndProgress.topic, format);
          setVisualMapData(mapResult.visualMap);
          setContentAndProgress(prev => ({ ...prev, visualMaps: [...(prev.visualMaps || []), mapResult.visualMap] }));
        }
      } else if (newMode === 'audio') {
         setDisplayedText('');
         if (contentAndProgress.audioNarrations && contentAndProgress.audioNarrations.length > 0) {
            setAudioUrl(contentAndProgress.audioNarrations[0].url); // Use first available
         } else {
            toast.warn("No pre-generated audio. Manual or AI generation can be added via edit page or AI features.");
            // Placeholder for future on-demand AI audio generation
            // const textForAudio = displayedText || contentAndProgress.originalText;
            // const narrationData = await generateAudioNarration(contentAndProgress._id, textForAudio);
            // setAudioUrl(narrationData.narration.url);
            // setContentAndProgress(prev => ({...prev, audioNarrations: [...(prev.audioNarrations || []), narrationData.narration]}));
         }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to generate ${newMode} content.`;
      setError(errorMsg); toast.error(errorMsg);
    } finally {
      setIsProcessingMode(false);
    }
  }, [contentAndProgress, userPrefs, selectedSimplificationLevel, logInteraction]);

  const handleQaSubmit = async (e) => {
    e.preventDefault();
    if (!qaQuestion.trim() || !contentAndProgress) return;
    setQaLoading(true); setQaError(''); setQaAnswer('');
    try {
        const result = await askQuestionApi(qaQuestion, contentAndProgress.topic, contentAndProgress._id);
        setQaAnswer(result.answer);
    } catch (err) {
        const errorMsg = err.response?.data?.error || "Failed to get an answer.";
        setQaError(errorMsg);
        toast.error(errorMsg);
    } finally {
        setQaLoading(false);
        setQaQuestion(''); // Clear input after submission
    }
  };


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

  const imageUrlsToDisplay = contentAndProgress?.media?.imageUrls || [];
  const showImagesPreference = userPrefs?.showContentImages !== undefined ? userPrefs.showContentImages : true;
  const imageLayoutPreference = userPrefs?.imageLayout || 'stacked';

  if (loading && !contentAndProgress) return <LoadingSpinner text={`Loading ${topicSlug.replace(/-/g, ' ')}...`} />;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-4">
        <Link to="/dashboard" className="text-sm text-[var(--color-link)] hover:underline">← Back to Dashboard</Link>
      </div>

      {error && <ErrorMessageDisplay message={error} />}
      {!contentAndProgress && !loading && !error && <InfoMessageDisplay message={`No content found for "${topicSlug}".`} />}

      {contentAndProgress && (
        <div className="space-y-8">
          <h1 className="capitalize">{contentAndProgress.topic.replace(/-/g, ' ')}</h1>

          <div className="mb-8">
            <div className="mb-6 border-b pb-3 flex flex-wrap gap-2 items-center border-[var(--color-border)]">
              {['original', 'simplified', 'visual', 'audio'].map((modeName) => (
                <button
                  key={modeName}
                  onClick={() => handleModeChange(modeName)}
                  disabled={isProcessingMode && currentMode !== modeName}
                  className={getButtonClass(currentMode === modeName)}
                >
                  {isProcessingMode && currentMode === modeName ? `Loading...` : modeName.charAt(0).toUpperCase() + modeName.slice(1)}
                </button>
              ))}
              {currentMode === 'simplified' && (
                <select
                  value={selectedSimplificationLevel}
                  onChange={(e) => handleModeChange('simplified', { level: e.target.value })}
                  disabled={isProcessingMode}
                  className="form-input-default ml-2 px-2 py-1.5 text-sm !w-auto"
                  aria-label="Select simplification level"
                >
                  {SIMPLIFICATION_LEVELS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
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
                   displayedText ? <div dangerouslySetInnerHTML={{ __html: displayedText.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br />') }} /> : // Basic paragraph/br handling
                   !isProcessingMode && <InfoMessageDisplay message="No text content available for this mode." />
              )}
              {currentMode === 'visual' && (
                   isProcessingMode && !visualMapData ? <LoadingSpinner text="Generating visual map..." /> :
                   visualMapData && visualMapData.data && visualMapData.format === 'mermaid' ? (
                       <MermaidDiagram chartData={visualMapData.data} diagramId={`content-map-${contentAndProgress._id}-${Date.now()}`} />
                   ) :
                   visualMapData && visualMapData.data && visualMapData.format !== 'mermaid' ? (
                        <pre className="whitespace-pre-wrap break-words">{visualMapData.data}</pre>
                   ) :
                   !isProcessingMode && <InfoMessageDisplay message="No visual map available or format not supported." />
              )}
              {currentMode === 'audio' && (
                   isProcessingMode && !audioUrl ? <LoadingSpinner text="Loading audio..." /> :
                   audioUrl ? <audio controls src={audioUrl} className="w-full my-2 body-theme-high-contrast:[color-scheme:dark]">Your browser does not support audio.</audio> :
                   !isProcessingMode && <InfoMessageDisplay message="No audio available for this content." />
              )}
            </article>
          </div>

          {showImagesPreference && imageUrlsToDisplay && imageUrlsToDisplay.length > 0 && (
            <section className="my-8 py-6 border-t border-b border-[var(--color-border)]" aria-labelledby="illustrations-heading">
              <h2 id="illustrations-heading" className="text-xl font-semibold mb-6 text-center text-[var(--color-text-secondary)]">
                Illustrations / Visual Aids
              </h2>
              <div className={`${imageLayoutPreference === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6' : 'space-y-6 max-w-2xl mx-auto'}`}>
                {imageUrlsToDisplay.map((url, index) => (
                  url && typeof url === 'string' && url.trim() !== '' ? (
                    <figure key={`content-image-${index}-${url.slice(-10)}`} className="bg-[var(--color-card-background)] rounded-lg overflow-hidden shadow-lg border border-[var(--color-border)] group">
                      <img src={url} alt={`${contentAndProgress.topic.replace(/-/g, ' ')} illustration ${index + 1}`}
                           className={`w-full block mx-auto transition-transform duration-300 group-hover:scale-105
                                       ${imageLayoutPreference === 'grid' ? 'h-full object-cover aspect-[16/10]' : 'h-auto max-h-[60vh] object-contain'}`}
                           loading="lazy"
                           onError={(e) => { e.target.style.display = 'none'; if(e.target.parentElement) { const errP = document.createElement('p'); errP.className = 'text-xs text-red-500 p-4 text-center'; errP.textContent = 'Image failed to load'; e.target.parentElement.appendChild(errP); }}} />
                    </figure>
                  ) : null
                ))}
              </div>
            </section>
          )}

          {isAuthenticated && (
            <div className="mt-10 card">
                <h3 className="text-xl font-semibold mb-4">Interactive Companion (AI Tutor)</h3>
                <form onSubmit={handleQaSubmit} className="space-y-3">
                    <div>
                        <label htmlFor="qa-question" className="form-label-default">Ask a question about "{contentAndProgress.topic.replace(/-/g, ' ')}":</label>
                        <textarea
                            id="qa-question"
                            rows="3"
                            className="form-input-default"
                            value={qaQuestion}
                            onChange={(e) => setQaQuestion(e.target.value)}
                            placeholder="e.g., Can you explain this concept in simpler terms?"
                            required
                        />
                    </div>
                    <button type="submit" className="button-primary" disabled={qaLoading || !qaQuestion.trim()}>
                        {qaLoading ? "Thinking..." : "Ask AI Tutor"}
                    </button>
                </form>
                {qaError && <ErrorMessageDisplay message={qaError} />}
                {qaAnswer && !qaError && (
                    <div className="mt-6 p-4 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] shadow">
                        <h4 className="font-semibold text-[var(--color-text-primary)] mb-2">AI Tutor's Response:</h4>
                        <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: qaAnswer.replace(/\n/g, '<br />') }}></div>
                    </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentPage;