'use client';

import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    // Fallback if context is not available, though this shouldn't happen
    // in a correctly structured application.
    return null; 
  }

  const { theme, toggleTheme } = context;

  // Base styles for the switch container (button)
  // Manual shadow: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
  // Dark mode manual shadow: 'dark:shadow-[4px_4px_0px_0px_var(--cream-hex)]'
  const switchBaseStyles = `
    w-10 h-16 rounded 
    border-2 border-black dark:border-[var(--cream-hex)]
    shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]
    dark:shadow-[4px_4px_0px_0px_var(--cream-hex)]
    flex flex-col items-center 
    p-1 cursor-pointer 
    transition-all duration-300 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    focus:ring-pixel-purple dark:focus:ring-offset-[var(--dark-brown-hex)] dark:focus:ring-[var(--accent-pastel-blue-hex)]
  `;

  // Styles that change with the theme for the switch container
  const switchThemeStyles = theme === 'light' 
    ? 'bg-pixel-blue hover:bg-pixel-purple justify-start' // Handle at top
    : 'bg-[var(--light-brown-hex)] hover:bg-[var(--beige-hex)] justify-end'; // Handle at bottom

  // Styles for the "pull handle" (div)
  const handleBaseStyles = `
    w-6 h-6 rounded-sm 
    border-2 border-black dark:border-[var(--cream-hex)]
    transition-colors duration-300 ease-in-out 
  `; // Removed transition-all as only color changes based on theme here

  // Styles that change with the theme for the handle
  const handleThemeStyles = theme === 'light'
    ? 'bg-pixel-pink' // Original light mode handle color
    : 'bg-[var(--accent-pastel-blue-hex)]'; // Dark mode handle color
  
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className={`${switchBaseStyles} ${switchThemeStyles}`}
      type="button"
    >
      {/* The "Pull Handle" or "Knob" */}
      <div className={`${handleBaseStyles} ${handleThemeStyles}`}>
        {/* Optional: Inner detail for the handle, e.g., a small dot or icon */}
        {/* <span className="block w-2 h-2 m-auto bg-black dark:bg-white rounded-full"></span> */}
      </div>
    </button>
  );
};

export default ThemeSwitcher;
