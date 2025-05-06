// src/components/UserProfile.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect
import { useAuth } from '../contexts/AuthContext'; // Changed to useAuth

const UserProfile = () => {
  // Destructure what you need from the unified AuthContext
  const { user, updateUserPreferences, loading: authLoading, error: authError } = useAuth();
  const [prefs, setPrefs] = useState({});
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false); // Local loading state for the save button

  useEffect(() => {
    // Initialize prefs from user object when user data is available or changes
    if (user && user.preferences) {
      setPrefs(user.preferences);
    } else {
      // Set default or empty if no user/preferences (e.g., during initial load)
      setPrefs({
        readingLevel: 'basic',
        fontSize: 'medium',
        theme: 'light',
        preferredContentMode: 'text',
        ttsEnabled: false,
      });
    }
  }, [user]); // Re-run if user object changes

  if (authLoading && !user) return <p>Loading profile...</p>; // Show loading if user is not yet fetched

  if (!user) return (
    <div>
        <p>Please log in to view or update your profile and preferences.</p>
        {authError && <p style={{ color: 'red' }}>Error: {authError}</p>}
    </div>
  );


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrefs(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSaving(true);
    try {
      await updateUserPreferences(prefs);
      setMessage('Preferences updated successfully!');
    } catch (updateError) {
      setMessage(`Error: ${updateError.message || 'Failed to update preferences.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-semibold text-primary mb-6">User Profile & Preferences</h1>
      <div className="mb-4">
        <p><span className="font-semibold">Email:</span> {user.email}</p>
        <p><span className="font-semibold">Name:</span> {user.name || 'N/A'}</p>
      </div>

      {authError && !message && <p className="text-sm text-red-600 bg-red-100 p-2 rounded mb-4">Context Error: {authError}</p>}
      {message && <p className={`text-sm p-2 rounded mb-4 ${message.startsWith('Error:') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-medium text-gray-700 mb-3">Your Preferences</h2>
        <div>
          <label htmlFor="readingLevel" className="block text-sm font-medium text-gray-700">Reading Level:</label>
          <select name="readingLevel" id="readingLevel" value={prefs.readingLevel || 'basic'} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700">Font Size:</label>
          <select name="fontSize" id="fontSize" value={prefs.fontSize || 'medium'} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">X-Large</option>
          </select>
        </div>
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700">Theme:</label>
          <select name="theme" id="theme" value={prefs.theme || 'light'} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="high-contrast">High Contrast</option>
          </select>
        </div>
        <div>
          <label htmlFor="preferredContentMode" className="block text-sm font-medium text-gray-700">Preferred Content Mode:</label>
          <select name="preferredContentMode" id="preferredContentMode" value={prefs.preferredContentMode || 'text'} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
            <option value="text">Text</option>
            <option value="video">Video</option>
            <option value="visual">Visual Map</option>
            <option value="audio">Audio</option>
          </select>
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="ttsEnabled" id="ttsEnabled" checked={prefs.ttsEnabled || false} onChange={handleChange} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
          <label htmlFor="ttsEnabled" className="ml-2 block text-sm text-gray-900">
            Enable Text-to-Speech
          </label>
        </div>
        <button
          type="submit"
          disabled={isSaving || authLoading} // Disable if saving or context is busy with auth stuff
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;