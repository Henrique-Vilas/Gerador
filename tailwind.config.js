/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,ts,js}'
  ],
  theme: {
    extend: {
      colors: {
        offwhite: '#FAFAF7',
        offwhite2: '#F8F8F5'
      },
      boxShadow: {
        soft: '0 10px 25px rgba(0,0,0,0.08)'
      }
    },
  },
  plugins: [],
}