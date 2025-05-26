// src/hooks/useUserPreference.ts
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react'; // To get the user ID

// Define a generic prefix for all user preferences to avoid key collisions
const USER_PREFS_GENERAL_PREFIX = 'userPrefs_';

function useUserPreference<T>(
  preferenceKeySuffix: string, // e.g., 'hideCompleted' or 'sortByDueDate'
  defaultValue: T
): [T, (value: T | ((prevState: T) => T)) => void] {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Function to generate the full localStorage key
  const getPreferenceKey = useCallback(() => {
    if (!userId) return null;
    return `${USER_PREFS_GENERAL_PREFIX}${userId}_${preferenceKeySuffix}`;
  }, [userId, preferenceKeySuffix]);

  const [value, setValue] = useState<T>(() => {
    // Initial state loader function for useState
    // This part runs only on initial mount on the client
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    const key = getPreferenceKey();
    if (!key) return defaultValue; // Should ideally not happen if session is loaded

    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        // Handle boolean strings explicitly
        if (typeof defaultValue === 'boolean') {
          return (storedValue === 'true') as unknown as T;
        }
        // Potentially add more type-specific parsers if needed (e.g., for numbers)
        return JSON.parse(storedValue) as T; // Generic parse, ensure compatibility
      }
    } catch (error) {
      console.error(`Error reading preference '${key}' from localStorage:`, error);
    }
    return defaultValue;
  });

  // Effect to save preference to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) { // Guard against running on server or if no userId
      return;
    }
    const key = getPreferenceKey();
    if (!key) return; // Should not happen if userId is present

    try {
      // For booleans, store as 'true'/'false' strings. For others, JSON.stringify.
      const valueToStore = typeof value === 'boolean' ? String(value) : JSON.stringify(value);
      localStorage.setItem(key, valueToStore);
    } catch (error) {
      console.error(`Error saving preference '${key}' to localStorage:`, error);
    }
  }, [value, userId, getPreferenceKey]); // Rerun if value or user changes

  return [value, setValue];
}

export default useUserPreference;
