// src/components/dashboard/PredictiveSuggestions.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const PredictiveSuggestions = ({ userPreferences, recentActivity }) => {
  let suggestions = [];

  // Rule 1: If user prefers a certain mode, and has recent activity, suggest trying that mode.
  if (userPreferences?.preferredContentMode && recentActivity?.length > 0) {
    const mode = userPreferences.preferredContentMode;
    suggestions.push({
      id: 'pref-mode-1',
      text: `You prefer '${mode}' mode. Try exploring new topics with it!`,
      link: '/dashboard', // Link to explore topics page or similar
      linkText: 'Explore Topics'
    });
  }

  // Rule 2: If user has a reading level set, suggest simplifying content.
  if (userPreferences?.readingLevel && userPreferences.readingLevel !== 'advanced') {
    suggestions.push({
      id: 'reading-level-1',
      text: `Remember, you can simplify content to a '${userPreferences.readingLevel}' level for easier understanding.`,
      link: null
    });
  }
  
  // Rule 3: If user uses visual map for one topic, suggest for another if available (pseudo)
  const hasUsedVisual = recentActivity?.some(act => act.modesUsedFrequency?.find(m => m.mode.includes('visual')));
  if (hasUsedVisual) {
      suggestions.push({
          id: 'visual-map-1',
          text: "Visual maps can be helpful! Try generating one for a complex topic.",
          link: null
      });
  }


  if (suggestions.length === 0) {
    suggestions.push({
        id: 'default-sugg-1',
        text: "Explore topics and update your preferences to get personalized suggestions!",
        link: '/profile',
        linkText: 'Update Preferences'
    })
  }
  
  // Limit suggestions shown
  suggestions = suggestions.slice(0, 2);


  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Tips & Suggestions</h2>
      {suggestions.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)]">No suggestions right now. Keep learning!</p>
      )}
      <ul className="space-y-3">
        {suggestions.map(suggestion => (
          <li key={suggestion.id} className="p-3 border border-dashed border-[var(--color-border)] rounded-md bg-primary/5 dark:bg-primary-light/5">
            <p className="text-sm text-[var(--color-text-primary)]">{suggestion.text}</p>
            {suggestion.link && (
              <Link to={suggestion.link} className="text-xs text-[var(--color-link)] hover:underline mt-1 inline-block">
                {suggestion.linkText || 'Learn More'}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PredictiveSuggestions;