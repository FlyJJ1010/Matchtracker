/** Tailwind-instellingen voor match-tracker.nl (overgenomen uit de oude CDN-config). */
module.exports = {
  content: [
    './index.html',
    './404.html',
    './app/**/*.html',
    './uitleg/**/*.html',
    './privacy/**/*.html',
    './contact/**/*.html',
    './assets/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        slate: { 850: '#151e2e', 950: '#0a0f18' },
        brand: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
