/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'real-estate': '#e0f2f7',
        'app-developer': '#e6ffe6',
      },
    },
  },
  plugins: [],
}
