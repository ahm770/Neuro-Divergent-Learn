// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enables dark: variants when 'dark' class is on <html>
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#A7C7E7',
          DEFAULT: '#4A90E2',
          dark: '#1C3F94',
        },
        secondary: {
          light: '#FFC0CB',
          DEFAULT: '#FF69B4',
          dark: '#C71585',
        },
        'hc-text': '#FFFFFF',
        'hc-background': '#000000',
        'hc-link': '#FFFF00',
        'hc-link-hover': '#FFEE00', // A slightly different shade for hover
        'hc-border': '#FFFFFF',
        'hc-interactive': '#FFFF00', // For buttons or active elements
        'hc-interactive-text': '#000000', // Text on hc-interactive elements
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
        'opendyslexic': ['OpenDyslexic', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.gray.700'),
            '--tw-prose-headings': theme('colors.gray.900'),
            '--tw-prose-links': theme('colors.primary.DEFAULT'),
            '--tw-prose-invert-body': theme('colors.slate.300'),
            '--tw-prose-invert-headings': theme('colors.slate.100'),
            '--tw-prose-invert-links': theme('colors.primary.light'),
          },
        },
        'high-contrast': {
          css: {
            '--tw-prose-body': theme('colors.hc-text'),
            '--tw-prose-headings': theme('colors.hc-text'),
            '--tw-prose-links': theme('colors.hc-link'),
            '--tw-prose-bold': theme('colors.hc-text'),
            '--tw-prose-bullets': theme('colors.hc-text'),
            '--tw-prose-hr': theme('colors.hc-border'),
            '--tw-prose-quotes': theme('colors.hc-text'),
            '--tw-prose-quote-borders': theme('colors.hc-link'),
            '--tw-prose-code': theme('colors.hc-text'),
            '--tw-prose-pre-code': theme('colors.hc-text'),
            '--tw-prose-pre-bg': theme('colors.gray.900'), // Keep code block bg slightly distinct
            'img': {  border: `2px solid ${theme('colors.hc-border')}`},
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({ strategy: 'class' }),
  ],
};