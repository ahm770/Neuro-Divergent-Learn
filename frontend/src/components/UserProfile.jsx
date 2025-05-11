// src/components/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user, updateUserPreferences, loading: authLoading, error: authError } = useAuth();
  const [prefs, setPrefs] = useState({ /* ... initial prefs ... */
    readingLevel: 'basic', fontSize: 'medium', theme: 'light',
    dyslexiaFontEnabled: false, preferredContentMode: 'text', ttsEnabled: false,
  });
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setPrefs(prev => ({ ...prev, ...user.preferences }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrefs(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage(''); setIsSaving(true);
    try {
      await updateUserPreferences(prefs);
      setMessage('Preferences updated successfully!');
    } catch (updateError) {
      setMessage(`Error: ${updateError.message || 'Failed to update.'}`);
    } finally { setIsSaving(false); }
  };

  if (authLoading && !user) return <p className="text-center p-4">Loading profile...</p>;
  if (!user) return <p className="text-center p-4">Please log in.</p>;

  return (
    <div className="max-w-lg mx-auto card"> {/* Using .card class */}
      <h1>User Profile & Preferences</h1>
      <div className="mb-4">
        <p><span className="font-semibold">Email:</span> {user.email}</p>
        <p><span className="font-semibold">Name:</span> {user.name || 'N/A'}</p>
      </div>

      {authError && !message && <p className="info-error">{/* ... error ... */}</p>}
      {message && <p className={message.startsWith('Error:') ? "info-error" : "info-success"}>{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <h2>Your Preferences</h2>
        <div>
          <label htmlFor="theme" className="form-label-default">Theme:</label>
          <select name="theme" id="theme" value={prefs.theme} onChange={handleChange} className="form-input-default">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="high-contrast">High Contrast</option>
          </select>
        </div>
        <div>
          <label htmlFor="fontSize" className="form-label-default">Font Size:</label>
          <select name="fontSize" id="fontSize" value={prefs.fontSize} onChange={handleChange} className="form-input-default">
            <option value="small">Small</option> <option value="medium">Medium</option>
            <option value="large">Large</option> <option value="xlarge">X-Large</option>
          </select>
        </div>
         <div className="flex items-center">
          <input type="checkbox" name="dyslexiaFontEnabled" id="dyslexiaFontEnabled" checked={prefs.dyslexiaFontEnabled} onChange={handleChange} className="form-checkbox-default mr-2" />
          <label htmlFor="dyslexiaFontEnabled" className="form-label-default !mb-0"> {/* !mb-0 to override default label margin */}
            Enable Dyslexia-Friendly Font
          </label>
        </div>
        <div>
          <label htmlFor="readingLevel" className="form-label-default">Reading Level:</label>
          <select name="readingLevel" id="readingLevel" value={prefs.readingLevel} onChange={handleChange} className="form-input-default">
            <option value="basic">Basic</option> <option value="intermediate">Intermediate</option> <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label htmlFor="preferredContentMode" className="form-label-default">Preferred Content Mode:</label>
          <select name="preferredContentMode" id="preferredContentMode" value={prefs.preferredContentMode} onChange={handleChange} className="form-input-default">
            <option value="text">Text</option> <option value="video">Video</option>
            <option value="visual">Visual Map</option> <option value="audio">Audio</option>
          </select>
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="ttsEnabled" id="ttsEnabled" checked={prefs.ttsEnabled} onChange={handleChange} className="form-checkbox-default mr-2" />
          <label htmlFor="ttsEnabled" className="form-label-default !mb-0">
            Enable Text-to-Speech
          </label>
        </div>
        <button type="submit" disabled={isSaving || authLoading} className="button-primary w-full">
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};
export default UserProfile;

 