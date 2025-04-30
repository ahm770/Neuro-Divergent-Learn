import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// import { getContentByTopic, simplifyContent } from '../services/contentService'; // We'll create this service next
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api'; // Use api directly for now

// Placeholder components - create these later
const LoadingSpinner = () => <div className="text-center p-4">Loading...</div>;
const ErrorMessage = ({ message }) => <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{message}</div>;


const ContentPage = () => {
  const { topic } = useParams(); // Get topic from URL
  const { token } = useAuth(); // Needed for authenticated requests
  const [content, setContent] = useState(null);
  const [simplifiedText, setSimplifiedText] = useState('');
  const [currentMode, setCurrentMode] = useState('original'); // 'original', 'simplified', 'visual', 'audio'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simplifying, setSimplifying] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      if (!topic || !token) return; // Don't fetch if no topic or token
      setLoading(true);
      setError(null);
      setSimplifiedText(''); // Reset simplified text on topic change
      setCurrentMode('original'); // Reset mode

      try {
        // --- Replace with contentService.getContentByTopic(topic) later ---
        const response = await api.get(`/content/${topic}`);
        setContent(response.data);
         // Check if an 'easy' simplified version exists and load it initially?
         const easyVersion = response.data.simplifiedVersions?.find(v => v.level === 'easy');
         if (easyVersion) {
            setSimplifiedText(easyVersion.text);
         }
      } catch (err) {
        console.error("Failed to fetch content:", err);
         setError(err.response?.data?.message || `Content for "${topic}" not found or failed to load.`);
         setContent(null); // Ensure no stale content is shown
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [topic, token]); // Re-fetch if topic or token changes


  const handleSimplify = async (level = 'easy') => {
    if (!content || simplifying) return;
    setSimplifying(true);
    setError(null);

    try {
         // Check cache first
         const cachedVersion = content.simplifiedVersions?.find(v => v.level === level);
         if (cachedVersion) {
             setSimplifiedText(cachedVersion.text);
             setCurrentMode('simplified'); // Or set based on level?
             setSimplifying(false);
             return;
         }

        // --- Replace with contentService.simplifyContent(topic, level) later ---
        const response = await api.post(`/content/simplify`, { topic: content.topic, level });
        setSimplifiedText(response.data.simplifiedText);
        setCurrentMode('simplified');

        // Optimistically update local state (or refetch content to get updated versions array)
        if (content) {
            setContent(prev => ({
                ...prev,
                simplifiedVersions: [...(prev.simplifiedVersions || []), {level, text: response.data.simplifiedText}]
            }));
        }

    } catch (err) {
         console.error("Failed to simplify content:", err);
         setError(err.response?.data?.error || 'Failed to simplify content.');
    } finally {
         setSimplifying(false);
    }
  };

  // --- Placeholder functions for other modes ---
  const handleVisualMap = () => { alert('Visual Map mode not implemented yet.'); setCurrentMode('visual'); };
  const handleAudio = () => { alert('Audio mode not implemented yet.'); setCurrentMode('audio'); };


  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <Link to="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">← Back to Dashboard</Link>

      {error && !content && <ErrorMessage message={error} />} {/* Show critical error if content failed */}

      {content && (
        <div>
           {error && <ErrorMessage message={error} />} {/* Show non-critical errors (e.g., simplify failed) */}

          <h1 className="text-3xl font-bold mb-4 capitalize">{content.topic.replace('-', ' ')}</h1>

          {/* --- Content Mode Switching UI --- */}
          <div className="mb-6 border-b pb-3 flex flex-wrap gap-2">
              <button onClick={() => setCurrentMode('original')} className={`px-3 py-1 rounded ${currentMode === 'original' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Original Text</button>
              <button onClick={() => simplifiedText ? setCurrentMode('simplified') : handleSimplify()} disabled={simplifying} className={`px-3 py-1 rounded ${currentMode === 'simplified' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'} disabled:opacity-50`}>
                 {simplifying ? 'Simplifying...' : (simplifiedText ? 'Simplified' : 'Simplify Text')}
              </button>
              {/* Add buttons for other levels if needed */}
              {/* <button onClick={() => handleSimplify('moderate')} disabled={simplifying} className="...">Simplify (Moderate)</button> */}
              <button onClick={handleVisualMap} className={`px-3 py-1 rounded ${currentMode === 'visual' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Visual Map</button>
              <button onClick={handleAudio} className={`px-3 py-1 rounded ${currentMode === 'audio' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Audio</button>
          </div>

          {/* --- Content Display Area --- */}
          <div className="prose max-w-none p-4 border rounded bg-white shadow"> {/* Using prose for nice text styling */}
            {currentMode === 'original' && <div dangerouslySetInnerHTML={{ __html: content.originalText.replace(/\n/g, '<br />') }} />} {/* Basic display */}
            {currentMode === 'simplified' && <div>{simplifiedText || 'Click "Simplify Text" to generate.'}</div>}
            {currentMode === 'visual' && <div>Visual Map Area - To be implemented.</div>}
            {currentMode === 'audio' && <div>Audio Player Area - To be implemented.</div>}
          </div>

           {/* TODO: Add Interactive Companion (Chatbot) Component Here */}

        </div>
      )}
    </div>
  );
};

export default ContentPage;