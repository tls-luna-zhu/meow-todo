/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'pixel-pink': '#FF69B4',
        'pixel-purple': '#9370DB',
        'pixel-blue': '#87CEEB',
        'pixel-green': '#98FB98',
        // Cappuccino dark mode palette
        'dark-brown': '#4A3B2A', // Background
        'light-brown': '#A07855', // Card/Container background
        'beige': '#D4B483',      // Card/Container background
        'cream': '#F5EFE6',      // Text
        'accent-pastel-blue': '#A2D2FF', // Accent
        'accent-pastel-pink': '#FFC8DD', // Accent
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