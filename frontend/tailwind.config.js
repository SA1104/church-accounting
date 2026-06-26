/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        church: {
          50: '#f5f7fa',
          100: '#e4ebf3',
          200: '#c2d2e3',
          300: '#90afd1',
          400: '#5884b8',
          500: '#38669b',
          600: '#2b517d',
          700: '#244265',
          800: '#1f3855',
          900: '#1c3149',
          950: '#121f30',
        }
      }
    },
  },
  plugins: [],
}
