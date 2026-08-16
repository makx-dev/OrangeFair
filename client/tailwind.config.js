/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#599AD7',
        accent: '#EBB773',
        dark: '#313131',
        surface: '#FFFFFF',
      },
    },
  },
  plugins: [],
};
