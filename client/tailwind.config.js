/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#253C6D',
        secondary: '#30497D',
        supporting: '#455B8A',
        accent: '#F2842F'
      }
    },
  },
  plugins: [],
}
