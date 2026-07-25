/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#1A1A1A',
        card: '#222222',
        primary: '#C0392B',
        'primary-light': '#E74C3C',
        gold: '#F39C12',
        running: '#E74C3C',
        swimming: '#2980B9',
        cycling: '#27AE60',
      },
    },
  },
  plugins: [],
};
