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

  const fetchContentData = useCallback(async () => {
    // ... (same as your previous good version)
    if (!topic) return;
    setLoading(true);
    setError(null); setContent(null); setDisplayedText(''); setVisualMapData(null); setAudioUrl(null); setCurrentMode('original');
    try {
      const data = await getContentByTopic(topic);
      console.log("data::", data)
      setContent(data);
      setDisplayedText(data.originalText);
      if (userPrefs?.preferredContentMode) {
        const prefMode = userPrefs.preferredContentMode;
        const readingLevel = userPrefs.readingLevel === 'basic' ? 'easy' : 'moderate';
        if (prefMode === 'simplified' && data.simplifiedVersions?.length > 0) {
           const version = data.simplifiedVersions.find(v => v.level === readingLevel) || data.simplifiedVersions[0];
           if(version) { setDisplayedText(version.text); setCurrentMode('simplified'); }
        } else if (prefMode === 'visual' && data.visualMaps?.length > 0) {
            setVisualMapData(data.visualMaps[0]); setCurrentMode('visual');
        } else if (prefMode === 'audio' && data.audioNarrations?.length > 0) {
            setAudioUrl(data.audioNarrations[0].url); setCurrentMode('audio');
        }
      }
    } catch (err) { setError(err.response?.data?.message || `Content for "${topic}" not found.`); }
    finally { setLoading(false); }
  }, [topic, userPrefs]);

  useEffect(() => { fetchContentData(); }, [fetchContentData]);

  const handleModeChange = async (mode, params = {}) => {
    // ... (same as your previous good version, ensure setContent is used to update cache)
    setError(null);
    if (mode === currentMode && mode !== 'simplified') return;
    setCurrentMode(mode); setIsProcessingMode(true); setVisualMapData(null); setAudioUrl(null);
    try {
      if (!content) { setError("Content not loaded."); return; }
      if (mode === 'original') { setDisplayedText(content.originalText); }
      else if (mode === 'simplified') { /* ... fetch/cache logic ... */
        const level = params.level || (userPrefs?.readingLevel === 'basic' ? 'easy' : 'moderate') || 'easy';
        const cachedVersion = content.simplifiedVersions?.find(v => v.level === level);
        if (cachedVersion) { setDisplayedText(cachedVersion.text); }
        else { /* ... API call, then setDisplayedText and update content state ... */
            const simplifiedData = await simplifyContent(content.topic, level);
            setDisplayedText(simplifiedData.simplifiedText);
            setContent(prev => ({...prev, simplifiedVersions: [...(prev.simplifiedVersions || []), {level, text: simplifiedData.simplifiedText, createdAt: new Date()}]}));
        }
      }
      else if (mode === 'visual') { /* ... fetch/cache logic ... */
        setDisplayedText('');
        const format = 'mermaid';
        const cachedMap = content.visualMaps?.find(v => v.format === format);
        if (cachedMap) {setVisualMapData(cachedMap);}
        else { /* ... API call, then setVisualMapData and update content state ... */
            const mapData = await generateVisualMap(content.topic, format);
            setVisualMapData(mapData.visualMap);
            setContent(prev => ({...prev, visualMaps: [...(prev.visualMaps || []), mapData.visualMap]}));
        }
      }
      else if (mode === 'audio') { /* ... fetch/cache logic ... */
        setDisplayedText('');
        const textForAudio = content.simplifiedVersions?.find(v => v.level === ((userPrefs?.readingLevel === 'basic' ? 'easy' : 'moderate') || 'easy'))?.text || content.originalText;
        const cachedAudio = content.audioNarrations?.[0]; // Simple cache check
        if(cachedAudio) { setAudioUrl(cachedAudio.url); }
        else if (textForAudio) { /* ... API call, then setAudioUrl and update content state ... */
            const narrationData = await generateAudioNarration(content._id, textForAudio);
            setAudioUrl(narrationData.narration.url);
            setContent(prev => ({...prev, audioNarrations: [...(prev.audioNarrations || []), narrationData.narration]}));
        } else { setError("No text to narrate.");}
      }
    } catch (err) { setError(err.response?.data?.error || `Failed to generate ${mode} content.`); }
    finally { setIsProcessingMode(false); }
  };

  const getProseClass = () => userPrefs?.theme === 'high-contrast' ? 'prose-high-contrast' : '';

  if (loading) return <LoadingSpinner text={`Loading ${topic.replace('-', ' ')}...`} />;

  const getButtonClass = (modeNameIsCurrent) => {
    let base = "px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ";
    if (modeNameIsCurrent) {
        if (userPrefs?.theme === 'high-contrast') return base + "bg-hc-interactive text-hc-interactive-text";
        return base + "bg-primary text-white dark:bg-primary-light dark:text-slate-900 shadow-md";
    } else {
        if (userPrefs?.theme === 'high-contrast') return base + "bg-hc-background text-hc-text border border-hc-border hover:bg-gray-800"; // Assuming gray-800 is dark enough for HC hover
        return base + "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200";
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-4">
        <Link to="/dashboard" className="text-sm">← Back to Dashboard</Link>
      </div>

      {error && <ErrorMessage message={error} />}
      {!content && !loading && !error && <InfoMessage message={`No content found for "${topic}".`} />}

      {content && (
        <div>
          <h1 className="capitalize">{content.topic.replace(/-/g, ' ')}</h1>

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
                    value={(userPrefs?.readingLevel === 'basic' ? 'easy' : 'moderate') || 'easy'}
                    onChange={(e) => handleModeChange('simplified', { level: e.target.value })}
                    disabled={isProcessingMode}
                    className="form-input-default ml-2 px-2 py-1.5 text-sm" // Using .form-input-default from index.css
                >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                </select>
            )}
          </div>

          <article
            className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none 
                        p-4 md:p-6 border rounded shadow-sm 
                        bg-[var(--color-card-background)] border-[var(--color-border)]
                        dark:prose-invert ${getProseClass()}`}
          >
            {(currentMode === 'original' || currentMode === 'simplified') && ( /* ... content ... */
                 isProcessingMode && !displayedText ? <LoadingSpinner text={currentMode === 'original' ? 'Loading...' : 'Simplifying...'} /> :
                 displayedText ? <div dangerouslySetInnerHTML={{ __html: displayedText.replace(/\n/g, '<br />') }} /> :
                 !isProcessingMode && <InfoMessage message="No text content." />
            )}
            {currentMode === 'visual' && ( /* ... content ... */
                 isProcessingMode && !visualMapData ? <LoadingSpinner text="Generating visual map..." /> :
                 visualMapData ? <MermaidDiagram chartData={visualMapData.data} diagramId={`content-map-${content._id}`} /> :
                 !isProcessingMode && <InfoMessage message="No visual map." />
            )}
            {currentMode === 'audio' && ( /* ... content ... */
                 isProcessingMode && !audioUrl ? <LoadingSpinner text="Generating audio..." /> :
                 audioUrl ? <audio controls src={audioUrl} className="w-full my-2 body-theme-high-contrast:[color-scheme:dark]">Your browser does not support audio.</audio> :
                 !isProcessingMode && <InfoMessage message="No audio." />
            )}
          </article>

          <div className="mt-8 card"> {/* Using .card class */}
            <h3 className="text-xl font-semibold mb-3">Interactive Companion</h3>
            <p className="text-[var(--color-text-secondary)]">Ask questions and get personalized help related to this topic.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPage;