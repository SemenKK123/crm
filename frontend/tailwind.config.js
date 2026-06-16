/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        ink: { DEFAULT: '#0f1117', 50: '#f5f6f8', 100: '#e8eaef', 200: '#d0d4de', 300: '#a8afc3', 400: '#7a85a0', 500: '#556078', 600: '#3e4a61', 700: '#2c3548', 800: '#1c2233', 900: '#0f1117' },
        accent: { DEFAULT: '#3b6cf7', light: '#6b93ff', dark: '#1f4fd0' },
        success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
      },
    },
  },
  plugins: [],
};
