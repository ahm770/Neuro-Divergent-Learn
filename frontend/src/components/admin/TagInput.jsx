// src/components/admin/TagInput.jsx
import React, { useState, useEffect } from 'react';

const TagInput = ({ initialTags = [], onChange, label = "Tags", placeholder = "Add a tag and press Enter" }) => {
  const [tags, setTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Sync with initialTags if it changes externally (e.g., loading data in Edit page)
    setTags(initialTags);
  }, [initialTags]);


  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        const newTagsArray = [...tags, newTag];
        setTags(newTagsArray);
        onChange(newTagsArray); // Notify parent
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      const newTagsArray = tags.slice(0, -1);
      setTags(newTagsArray);
      onChange(newTagsArray); // Notify parent
    }
  };

  const removeTag = (tagToRemove) => {
    const newTagsArray = tags.filter(tag => tag !== tagToRemove);
    setTags(newTagsArray);
    onChange(newTagsArray); // Notify parent
  };

  return (
    <div className="form-field-default">
      <label className="form-label-default">{label}</label>
      <div className="form-input-default flex flex-wrap items-center gap-2 p-2 min-h-[42px]"> {/* Apply input styling to the wrapper */}
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center bg-primary/20 dark:bg-primary-light/30 text-primary dark:text-primary-light text-sm font-medium px-2 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-2 text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white focus:outline-none"
              aria-label={`Remove ${tag}`}
            >
              × {/* x icon */}
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={tags.length === 0 ? placeholder : "Add another tag..."}
          className="flex-grow bg-transparent border-none focus:ring-0 p-0 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]"
        />
      </div>
       <p className="text-xs text-[var(--color-text-secondary)] mt-1">Press Enter or comma to add a tag. Backspace to remove last tag if input is empty.</p>
    </div>
  );
};

export default TagInput;