/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        farm: {
          primary: '#1e4620',
          dark: '#123014',
          light: '#e9f5ec',
          accent: '#2e7d32',
          soil: '#8d6e63',
          amber: '#d97706',
          danger: '#dc2626',
        }
      },
    },
  },
  plugins: [],
}
