'use client';

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const ThemeSwitcher = () => {
  // Initialize state, default to 'light'. Actual value will be set by useEffect.
  const [theme, setTheme] = useState('light'); 

  // Effect to read cookie and set initial theme
  useEffect(() => {
    const storedTheme = Cookies.get('theme_preference');
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Optional: Check system preference, for now, default to 'light'
      // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // setTheme(prefersDark ? 'dark' : 'light');
      setTheme('light'); // Default to light if no cookie
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to apply theme class to <html> and update cookie
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    Cookies.set('theme_preference', theme, { expires: 365 }); // Save preference for 1 year
  }, [theme]); // Re-run this effect whenever the theme state changes

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 
        border-2 
        font-pixel 
        shadow-pixel 
        transition-all duration-150 ease-in-out
        hover:transform hover:-translate-y-0.5 hover:shadow-lg 
        active:transform active:translate-y-0.5 active:shadow-sm
        border-pixel-border-color dark:border-pixel-border-color 
        bg-pixel-pink dark:bg-pixel-purple 
        text-pixel-black-color dark:text-pixel-white-color
      `}
    >
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  );
};

export default ThemeSwitcher;
