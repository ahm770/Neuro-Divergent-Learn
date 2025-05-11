// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="text-center py-10 md:py-20"> {/* Added padding for better centering */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
        Welcome to the <br className="sm:hidden" /> {/* Break line on small screens */}
        <span className="text-primary dark:text-primary-light body-theme-high-contrast:text-hc-link">
          Accessible Learning Portal
        </span>
      </h1>
      <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] mb-8 max-w-2xl mx-auto">
        Your journey to personalized and inclusive learning starts here. We adapt to your unique way of learning.
      </p>
      <div className="space-y-4 sm:space-y-0 sm:space-x-4">
        <Link
          to="/signup"
          className="button-primary inline-block text-lg px-8 py-3 w-full sm:w-auto" // Using generic button class
        >
          Get Started (Sign Up)
        </Link>
        <Link
          to="/login"
          className="button-secondary inline-block text-lg px-8 py-3 w-full sm:w-auto" // Using generic button class
        >
          Already have an account? Login
        </Link>
      </div>
      {/* You could add some feature highlights or graphics here */}
      {/* For example:
      <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-2">Customizable Content</h3>
          <p className="text-[var(--color-text-secondary)] text-sm">Choose how you learn: text, video, audio, or visual maps.</p>
        </div>
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-2">Distraction-Free</h3>
          <p className="text-[var(--color-text-secondary)] text-sm">Minimal UI with adjustable fonts and colors for focus.</p>
        </div>
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-2">AI Companion</h3>
          <p className="text-[var(--color-text-secondary)] text-sm">Get personalized guidance and explanations on any topic.</p>
        </div>
      </div>
      */}
    </div>
  );
};

export default HomePage;