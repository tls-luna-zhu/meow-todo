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
        // New Dark Pastel Palette
        'dark-lavender': '#5C4B99',      // Main background
        'dark-pastel-bg-alt': '#4A686A', // Card/container background (Dark Teal)
        'light-pastel-text': '#FFFACD',   // Primary text (Light Creamy Yellow)
        'pastel-accent-1': '#A2D2C8',     // Accent 1 (Soft Mint)
        'pastel-accent-2': '#FFDAB9',     // Accent 2 (Soft Peach)
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