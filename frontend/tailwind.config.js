// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html" // Good to include this too
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#A7C7E7',   // Example: A light blue - REPLACE WITH YOUR COLOR
          DEFAULT: '#4A90E2', // Example: Your main primary blue - REPLACE WITH YOUR COLOR
          dark: '#1C3F94',    // Example: A dark blue - REPLACE WITH YOUR COLOR
        },
        secondary: {
          light: '#FFC0CB',   // Example: Light Pink - REPLACE WITH YOUR COLOR
          DEFAULT: '#FF69B4', // Example: Hot Pink - REPLACE WITH YOUR COLOR
          dark: '#C71585',    // Example: Medium Violet Red - REPLACE WITH YOUR COLOR
        },
        // You can add other custom colors here if needed
        // For example, for your theme-dark, theme-high-contrast backgrounds/text
        'custom-dark-bg': '#1a202c',      // Example dark background
        'custom-dark-text': '#e2e8f0',    // Example light text for dark bg
        'custom-high-contrast-bg': '#000000',
        'custom-high-contrast-text': '#FFFFFF',
      },
      // If you were planning to use custom font families:
      // fontFamily: {
      //   'opendyslexic': ['OpenDyslexic', 'sans-serif'], // Ensure OpenDyslexic is loaded
        // 'sans': ['Inter', 'system-ui' ] // Example custom default sans-serif
      // },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // You need this for the 'prose' classes
    require('@tailwindcss/forms'), // If you plan to use form styling enhancements
  ],
}