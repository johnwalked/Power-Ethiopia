/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        red: {
          450: '#ef4444',
          950: '#450a0a',
        },
        slate: {
          850: '#1e293b',
          950: '#020617',
        }
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
