/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0e17',
          elevated: '#111827',
          subtle: '#0d1421',
        },
        border: {
          DEFAULT: '#1f2937',
          strong: '#374151',
        },
        accent: {
          DEFAULT: '#22d3ee',
          green: '#10b981',
          red: '#ef4444',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
