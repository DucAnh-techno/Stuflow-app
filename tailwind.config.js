/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}", // nếu dùng Expo Router
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
