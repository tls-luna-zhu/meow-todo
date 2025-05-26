// src/hooks/useUserPreference.ts
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Keep console.logs uncommented for this subtask to verify the fix during testing phase
// (Normally, they would be removed after debugging)

const USER_PREFS_GENERAL_PREFIX = 'userPrefs_';

// Helper function to parse stored string values from localStorage
function parseStoredValue<T>(
  storedValue: string | null,
  defaultValue: T,
  preferenceKeySuffixForLogging?: string // Optional for more specific logs
): T {
  const logPrefix = preferenceKeySuffixForLogging 
    ? `[parseStoredValue (${preferenceKeySuffixForLogging})]` 
    : '[parseStoredValue]';

  if (storedValue === null) {
    console.log(`${logPrefix} No stored value, returning default.`);
    return defaultValue;
  }

  if (typeof defaultValue === 'boolean') {
    const parsed = storedValue === 'true';
    console.log(`${logPrefix} Parsed boolean from '${storedValue}':`, parsed);
    return parsed as unknown as T;
  }

  // For non-boolean types, attempt JSON.parse
  try {
    console.log(`${logPrefix} Attempting JSON.parse on:`, storedValue);
    const parsed = JSON.parse(storedValue);
    console.log(`${logPrefix} Parsed non-boolean via JSON:`, parsed);
    return parsed as T;
  } catch (e) {
    // If JSON.parse fails, check if the defaultValue is a string.
    // If so, assume the stored value might be a raw string (for backward compatibility).
    if (typeof defaultValue === 'string') {
      console.warn(`${logPrefix} JSON.parse failed. Assuming raw string for '${storedValue}'. Error:`, e);
      return storedValue as unknown as T;
    }
    // For other types, or if defaultValue isn't string, JSON.parse error is more critical.
    console.error(`${logPrefix} Error parsing preference from localStorage. Value was: '${storedValue}'. Error:`, e, 'Returning default.');
    return defaultValue;
  }
}

function useUserPreference<T>(
  preferenceKeySuffix: string,
  defaultValue: T
): [T, (value: T | ((prevState: T) => T)) => void] {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;

  console.log(`[useUserPreference (${preferenceKeySuffix})] Hook init. Default:`, defaultValue, 'Session Status:', sessionStatus, 'User ID:', userId);

  const getPreferenceKey = useCallback(() => {
    if (!userId) {
      console.log(`[useUserPreference (${preferenceKeySuffix})] getPreferenceKey: No userId, returning null.`);
      return null;
    }
    const key = `${USER_PREFS_GENERAL_PREFIX}${userId}_${preferenceKeySuffix}`;
    console.log(`[useUserPreference (${preferenceKeySuffix})] getPreferenceKey: Generated key:`, key);
    return key;
  }, [userId, preferenceKeySuffix]);

  const [value, setValue] = useState<T>(() => {
    console.log(`[useUserPreference (${preferenceKeySuffix})] useState initializer running. typeof window:`, typeof window);
    if (typeof window === 'undefined') {
      console.log(`[useUserPreference (${preferenceKeySuffix})] useState: SSR, returning default.`);
      return defaultValue;
    }

    const key = getPreferenceKey();
    console.log(`[useUserPreference (${preferenceKeySuffix})] useState: Initial key:`, key);

    if (!key) {
      console.warn(`[useUserPreference (${preferenceKeySuffix})] useState: No key (userId likely unavailable), returning default.`);
      return defaultValue;
    }

    try {
      const storedValue = localStorage.getItem(key);
      console.log(`[useUserPreference (${preferenceKeySuffix})] useState: localStorage.getItem('${key}') returned:`, storedValue);
      // Use the parseStoredValue helper function
      return parseStoredValue<T>(storedValue, defaultValue, preferenceKeySuffix);
    } catch (error) {
      // This catch block handles errors from localStorage.getItem itself (e.g., security restrictions)
      console.error(`[useUserPreference (${preferenceKeySuffix})] useState: Error from localStorage.getItem for key '${key}':`, error);
      return defaultValue; // Fallback to default if localStorage.getItem throws
    }
  });

  // Effect to re-load from localStorage if userId becomes available OR if key changes
  useEffect(() => {
    console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect running. User ID:`, userId, 'Session Status:', sessionStatus);
    if (typeof window !== 'undefined' && userId && sessionStatus === 'authenticated') {
      const key = getPreferenceKey();
      if (!key) {
        console.warn(`[useUserPreference (${preferenceKeySuffix})] Load effect: Could not generate key (userId: ${userId}).`);
        // If no key, it implies user is not properly available yet,
        // consider resetting to default if current value isn't already default.
        if (JSON.stringify(value) !== JSON.stringify(defaultValue)) {
            console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: No key, resetting to default.`);
            setValue(defaultValue);
        }
        return;
      }
      
      console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: Attempting to load for key:`, key);
      try {
        const storedValue = localStorage.getItem(key);
        console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: localStorage.getItem('${key}') returned:`, storedValue);
        
        const newValue = parseStoredValue<T>(storedValue, defaultValue, preferenceKeySuffix);
        console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: Parsed value from parseStoredValue:`, newValue);

        // Only update state if the newly parsed value is different from the current state value.
        // This avoids unnecessary re-renders if the value in localStorage was already reflected or was invalid.
        if (JSON.stringify(value) !== JSON.stringify(newValue)) {
            console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: Value from storage ('${JSON.stringify(newValue)}') is different from current state ('${JSON.stringify(value)}'), calling setValue.`);
            setValue(newValue);
        } else {
            console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: Parsed value is same as current state, no state update needed.`);
        }
        
      } catch (error) {
        // This catch primarily handles errors from localStorage.getItem itself.
        // parseStoredValue handles its own parsing errors and returns defaultValue.
        console.error(`[useUserPreference (${preferenceKeySuffix})] Load effect: Error directly from localStorage.getItem or during parseStoredValue for key '${key}':`, error);
        // If an error occurs, and current value is not default, reset to default.
        if (JSON.stringify(value) !== JSON.stringify(defaultValue)) {
            console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: Error occurred, resetting to default.`);
            setValue(defaultValue);
        }
      }
    } else if (sessionStatus !== 'loading' && !userId) {
        // Handle case where session is loaded but there's no user (e.g., logged out)
        // Reset to default if current value isn't already default.
        console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: User logged out or session available but no user. Resetting to default if needed.`);
        if (JSON.stringify(value) !== JSON.stringify(defaultValue)) {
            setValue(defaultValue);
        }
    }
  }, [userId, preferenceKeySuffix, defaultValue, getPreferenceKey, sessionStatus, value]); // Added `value` to dependency array

  // Effect to save preference to localStorage when it changes
  useEffect(() => {
    console.log(`[useUserPreference (${preferenceKeySuffix})] Save effect running. Value:`, value, 'User ID:', userId, 'Session Status:', sessionStatus);
    if (typeof window !== 'undefined' && userId && sessionStatus === 'authenticated') {
      const key = getPreferenceKey();
      if (!key) {
        console.warn(`[useUserPreference (${preferenceKeySuffix})] Save effect: No key (userId: ${userId}), not saving.`);
        return;
      }
      
      console.log(`[useUserPreference (${preferenceKeySuffix})] Save effect: Attempting to save to key:`, key, 'Value:', value);
      try {
        // For non-booleans, always JSON.stringify. For booleans, use 'true'/'false'.
        const valueToStore = typeof value === 'boolean' ? String(value) : JSON.stringify(value);
        console.log(`[useUserPreference (${preferenceKeySuffix})] Save effect: Storing value:`, valueToStore);
        localStorage.setItem(key, valueToStore);
      } catch (error) {
        console.error(`[useUserPreference (${preferenceKeySuffix})] Save effect: Error saving preference '${key}':`, error);
      }
    }
  }, [value, getPreferenceKey, sessionStatus]); // Removed userId directly as getPreferenceKey depends on it.

  console.log(`[useUserPreference (${preferenceKeySuffix})] Returning value:`, value);
  return [value, setValue];
}

export default useUserPreference;
