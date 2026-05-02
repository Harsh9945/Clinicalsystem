/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6', // teal-500
          600: '#0d9488', // teal-600
          700: '#0f766e', // teal-700
        },
        secondary: {
          50: '#eff6ff',
          500: '#3b82f6', // blue-500
          600: '#2563eb', // blue-600
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
