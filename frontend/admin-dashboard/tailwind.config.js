/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'admin-bg': '#1F2937',
        'admin-surface': '#374151',
        'admin-primary': '#6366F1',
        'admin-approved': '#10B981',
        'admin-warning': '#FBBF24',
        'admin-error': '#F87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
