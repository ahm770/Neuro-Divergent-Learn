// src/components/admin/DynamicUrlInput.jsx
import React, { useState, useEffect } from 'react';

const DynamicUrlInput = ({ initialUrls = [], onChange, label = "Image URLs", placeholder = "https://example.com/image.jpg" }) => {
  const [urls, setUrls] = useState(initialUrls.length > 0 ? initialUrls : ['']);

  useEffect(() => {
    setUrls(initialUrls.length > 0 ? initialUrls : ['']);
  }, [initialUrls]);

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
    onChange(newUrls.filter(url => url && url.trim() !== '')); // Notify parent with non-empty URLs
  };

  const addUrlField = () => {
    setUrls([...urls, '']);
  };

  const removeUrlField = (index) => {
    if (urls.length <= 1 && index === 0) { // If it's the last field, just clear it
        handleUrlChange(index, '');
        return;
    }
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
    onChange(newUrls.filter(url => url && url.trim() !== ''));
  };

  // Basic check if a string looks like an image URL
  const isImageUrl = (url) => {
    return typeof url === 'string' && url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) != null;
  };

  return (
    <div className="form-field-default">
      <label className="form-label-default">{label}</label>
      <div className="space-y-3">
        {urls.map((url, index) => (
          <div key={index} className="flex items-start gap-2"> {/* items-start for preview alignment */}
            <div className="flex-grow"> {/* Input field takes remaining space */}
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder={`${placeholder} (#${index + 1})`}
                  className="form-input-default"
                />
            </div>
            {/* Image Preview */}
            {url && isImageUrl(url.trim()) && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-[var(--color-border)] rounded overflow-hidden border border-[var(--color-border)]">
                <img
                  src={url.trim()}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { 
                    // Optionally hide or show a broken image icon for the preview
                    e.target.style.display = 'none'; 
                    if(e.target.parentElement) e.target.parentElement.innerHTML = '<span class="text-xs text-red-500 p-1">Invalid</span>';
                  }}
                />
              </div>
            )}
            {/* Remove Button */}
            <button
              type="button"
              onClick={() => removeUrlField(index)}
              className="button-secondary text-sm !p-2 body-theme-high-contrast:text-hc-link body-theme-high-contrast:border-hc-link flex-shrink-0"
              aria-label={`Remove URL ${index + 1}`}
              title="Remove URL"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.197-2.326.372a.75.75 0 0 0-.569.934l1.06 3.18a.75.75 0 0 0 .934.569c.795-.265 1.59-.453 2.396-.558a.75.75 0 0 0 .622-.882l-.318-2.165A2.248 2.248 0 0 1 8.75 2.5h2.5A2.248 2.248 0 0 1 13.498 4.58l-.318 2.165a.75.75 0 0 0 .622.882c.807.105 1.601.293 2.396.558a.75.75 0 0 0 .934-.569l1.06-3.18a.75.75 0 0 0-.569-.934c-.746-.175-1.53-.295-2.326-.372v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM9.25 6.51V16h1.5V6.51l.011.002.021.002.022.002a24.32 24.32 0 0 1 2.99-.034c.795-.018 1.43.214 1.805.694.376.48.476 1.184.28 1.814l-.104.345a.75.75 0 0 1-1.341-.404l.104-.345c.098-.325.032-.65-.152-.922-.184-.271-.546-.425-1.046-.408a22.823 22.823 0 0 0-2.648.033l-.021-.002-.022-.002L9.25 6.51Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addUrlField}
        className="button-secondary text-sm mt-3"
      >
        + Add Another URL
      </button>
    </div>
  );
};

export default DynamicUrlInput;