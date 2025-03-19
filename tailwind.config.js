/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pixel-pink': '#FF69B4',
        'pixel-purple': '#9370DB',
        'pixel-blue': '#87CEEB',
        'pixel-green': '#98FB98',
      },
      fontFamily: {
        'pixel': ['Press Start 2P', 'cursive'],
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
      },
    },
  },
  plugins: [],
} 