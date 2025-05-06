// src/pages/ContentPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getContentByTopic,
  simplifyContent,
  generateVisualMap, // Assuming this will be implemented in contentService
  generateAudioNarration // Assuming this will be implemented in contentService
} from '../services/contentService';
import MermaidDiagram from '../components/common/MermaidDiagram'; // Adjust path if needed

// Placeholder components - create these properly
const LoadingSpinner = ({ text = "Loading..." }) => <div className="text-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div><p>{text}</p></div>;
const ErrorMessage = ({ message }) => <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded" role="alert"><p className="font-bold">Error</p><p>{message}</p></div>;
const InfoMessage = ({ message }) => <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 my-4 rounded" role="alert"><p>{message}</p></div>;


const ContentPage = () => {
  const { topic } = useParams();
  const { user } = useAuth(); // Get user for preferences

  const [content, setContent] = useState(null);
  const [currentMode, setCurrentMode] = useState('original'); // 'original', 'simplified', 'visual', 'audio'
  const [displayedText, setDisplayedText] = useState(''); // For original or simplified text

  // Mode-specific states
  const [visualMapData, setVisualMapData] = useState(null); // { format: 'mermaid', data: '...' }
  const [audioUrl, setAudioUrl] = useState(null);

  // Loading/Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingMode, setIsProcessingMode] = useState(false); // For AI generation actions

  const fetchContentData = useCallback(async () => {
    if (!topic) return;
    setLoading(true);
    setError(null);
    setContent(null); // Reset content on new topic load
    setDisplayedText('');
    setVisualMapData(null);
    setAudioUrl(null);
    setCurrentMode('original'); // Default to original

    try {
      const data = await getContentByTopic(topic);
      setContent(data);
      setDisplayedText(data.originalText); // Display original text by default

      // Auto-select preferred mode if content is available and user has preference
      if (user?.preferences?.preferredContentMode) {
        const prefMode = user.preferences.preferredContentMode;
        if (prefMode === 'simplified' && data.simplifiedVersions?.some(v => v.level === (user.preferences.readingLevel === 'basic' ? 'easy' : 'moderate'))) {
           const levelToLoad = user.preferences.readingLevel === 'basic' ? 'easy' : 'moderate';
           const version = data.simplifiedVersions.find(v => v.level === levelToLoad);
           if(version) {
               setDisplayedText(version.text);
               setCurrentMode('simplified');
           }
        }
        // Add similar logic for visual, audio if pre-generated content exists
      }

    } catch (err) {
      console.error("Failed to fetch content:", err);
      setError(err.response?.data?.message || `Content for "${topic}" not found or failed to load.`);
    } finally {
      setLoading(false);
    }
  }, [topic, user?.preferences?.preferredContentMode, user?.preferences?.readingLevel]); // Add user preferences as dependencies

  useEffect(() => {
    fetchContentData();
  }, [fetchContentData]);


  const handleModeChange = async (mode, params = {}) => {
    setError(null); // Clear previous mode-specific errors
    if (mode === currentMode && mode !== 'simplified') return; // Avoid re-processing if already in mode (except for re-simplifying)

    setCurrentMode(mode);
    setIsProcessingMode(true);

    try {
      if (mode === 'original') {
        setDisplayedText(content.originalText);
      } else if (mode === 'simplified') {
        const level = params.level || (user?.preferences?.readingLevel === 'basic' ? 'easy' : 'moderate') || 'easy';
        const cachedVersion = content.simplifiedVersions?.find(v => v.level === level);
        if (cachedVersion && params.level) { // Only use cache if specific level requested and found
          setDisplayedText(cachedVersion.text);
        } else {
          const simplifiedData = await simplifyContent(content.topic, level);
          setDisplayedText(simplifiedData.simplifiedText);
          // Optimistically update local content state with the new version
          if (content) {
            const existingVersionIndex = content.simplifiedVersions?.findIndex(v => v.level === level);
            let newSimplifiedVersions = [...(content.simplifiedVersions || [])];
            if (existingVersionIndex > -1) {
              newSimplifiedVersions[existingVersionIndex] = { level, text: simplifiedData.simplifiedText, createdAt: new Date() };
            } else {
              newSimplifiedVersions.push({ level, text: simplifiedData.simplifiedText, createdAt: new Date() });
            }
            setContent(prev => ({ ...prev, simplifiedVersions: newSimplifiedVersions }));
          }
        }
      } else if (mode === 'visual') {
        const format = 'mermaid'; // Or make this configurable
        const cachedMap = content.visualMaps?.find(v => v.format === format);
        if (cachedMap) {
            setVisualMapData(cachedMap);
        } else {
            const mapData = await generateVisualMap(content.topic, format);
            setVisualMapData(mapData.visualMap); // Assuming service returns { visualMap: { format, data, ... } }
             if (content) {
                setContent(prev => ({
                    ...prev,
                    visualMaps: [...(prev.visualMaps || []), mapData.visualMap]
                }));
            }
        }
      } else if (mode === 'audio') {
        // For MVP, assume audio is generated for the currently displayed text
        // In a real app, you might choose original or a specific simplified version
        if (content.audioNarrations && content.audioNarrations.length > 0) {
            setAudioUrl(content.audioNarrations[0].url); // Use first available cached audio
        } else if (displayedText) {
            const narrationData = await generateAudioNarration(content._id, displayedText);
            setAudioUrl(narrationData.narration.url); // Assuming service returns { narration: { url, ... } }
             if (content) {
                setContent(prev => ({
                    ...prev,
                    audioNarrations: [...(prev.audioNarrations || []), narrationData.narration]
                }));
            }
        } else {
            setError("No text available to narrate.");
        }
      }
    } catch (err) {
      console.error(`Failed to switch to ${mode} mode:`, err);
      setError(err.response?.data?.error || `Failed to generate ${mode} content.`);
      // Revert to original text on error if mode processing failed
      // setCurrentMode('original');
      // setDisplayedText(content?.originalText || '');
    } finally {
      setIsProcessingMode(false);
    }
  };

  // Apply dynamic styles based on user preferences
  const userPrefs = user?.preferences;
  const contentStyles = {
    fontSize: userPrefs?.fontSize === 'small' ? '0.875rem' :
              userPrefs?.fontSize === 'large' ? '1.25rem' :
              userPrefs?.fontSize === 'xlarge' ? '1.5rem' : '1rem', // medium/default
    fontFamily: userPrefs?.theme === 'dyslexia' ? 'OpenDyslexic, sans-serif' : 'inherit', // Assuming a 'dyslexia' theme option for font
  };
  // Theme class for container (light, dark, high-contrast)
  const themeClass = userPrefs?.theme === 'dark' ? 'theme-dark bg-gray-800 text-gray-100' :
                     userPrefs?.theme === 'high-contrast' ? 'theme-high-contrast bg-black text-white' :
                     'theme-light bg-gray-50';


  if (loading) return <LoadingSpinner text={`Loading ${topic.replace('-', ' ')}...`} />;

  return (
    <div className={`container mx-auto p-4 md:p-6 min-h-screen ${themeClass}`}>
      <div className="mb-4">
        <Link to="/dashboard" className={`hover:underline text-sm ${userPrefs?.theme === 'dark' || userPrefs?.theme === 'high-contrast' ? 'text-blue-300 hover:text-blue-200' : 'text-primary hover:text-primary-dark'}`}>
            ← Back to Dashboard
        </Link>
      </div>

      {error && <ErrorMessage message={error} />}

      {!content && !loading && !error && <InfoMessage message={`No content found for "${topic}".`} />}

      {content && (
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-6 capitalize">
            {content.topic.replace(/-/g, ' ')}
          </h1>

          {/* --- Content Mode Switching UI --- */}
          <div className="mb-6 border-b pb-3 flex flex-wrap gap-2 items-center">
            {['original', 'simplified', 'visual', 'audio'].map((modeName) => (
              <button
                key={modeName}
                onClick={() => handleModeChange(modeName)}
                disabled={isProcessingMode && currentMode !== modeName && modeName !== 'original'}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                  ${currentMode === modeName
                    ? 'bg-primary text-white shadow-md'
                    : `${userPrefs?.theme === 'dark' || userPrefs?.theme === 'high-contrast' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                `}
              >
                {isProcessingMode && currentMode === modeName ? `Loading ${modeName}...` : modeName.charAt(0).toUpperCase() + modeName.slice(1)}
              </button>
            ))}
            {currentMode === 'simplified' && ( // Show level options for simplified mode
                <select
                    value={(user?.preferences?.readingLevel === 'basic' ? 'easy' : 'moderate') || 'easy'}
                    onChange={(e) => handleModeChange('simplified', { level: e.target.value })}
                    disabled={isProcessingMode}
                    className={`ml-2 px-2 py-1.5 rounded text-sm border ${userPrefs?.theme === 'dark' || userPrefs?.theme === 'high-contrast' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'} focus:ring-primary focus:border-primary`}
                >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                </select>
            )}
          </div>

          {/* --- Content Display Area --- */}
          <article
            style={contentStyles}
            className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none p-4 md:p-6 border rounded shadow-sm
            ${userPrefs?.theme === 'dark' ? 'bg-gray-750 border-gray-700 prose-invert' :
            userPrefs?.theme === 'high-contrast' ? 'bg-gray-900 border-gray-600 prose-invert filter invert-[1] contrast-[2]' : // Example high contrast
            'bg-white border-gray-200'}`}
          >
            {currentMode === 'original' && <div dangerouslySetInnerHTML={{ __html: displayedText.replace(/\n/g, '<br />') }} />}
            {currentMode === 'simplified' && <div dangerouslySetInnerHTML={{ __html: displayedText.replace(/\n/g, '<br />') }} />}

            {currentMode === 'visual' && (
              isProcessingMode && !visualMapData ? <LoadingSpinner text="Generating visual map..." /> :
              visualMapData ? <MermaidDiagram chartData={visualMapData.data} diagramId={`content-map-${content._id}`} /> :
              !isProcessingMode && <InfoMessage message="No visual map generated or available." />
            )}

            {currentMode === 'audio' && (
              isProcessingMode && !audioUrl ? <LoadingSpinner text="Generating audio..." /> :
              audioUrl ? <audio controls src={audioUrl} className="w-full my-2">Your browser does not support the audio element.</audio> :
              !isProcessingMode && <InfoMessage message="No audio generated or available." />
            )}
          </article>

          {/* Interactive Companion (Chatbot) Placeholder */}
          <div className="mt-8 p-4 border rounded shadow-sm bg-white">
            <h3 className="text-xl font-semibold mb-3">Interactive Companion (Coming Soon)</h3>
            <p className="text-gray-600">Ask questions and get personalized help related to this topic.</p>
            {/* <ChatbotComponent topic={content.topic} /> */}
          </div>

        </div>
      )}
    </div>
  );
};

export default ContentPage;