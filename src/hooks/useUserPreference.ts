// src/hooks/useUserPreference.ts
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Keep console.logs uncommented for this subtask to verify the fix during testing phase
// (Normally, they would be removed after debugging)

const USER_PREFS_GENERAL_PREFIX = 'userPrefs_';

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
      if (storedValue !== null) {
        if (typeof defaultValue === 'boolean') {
          const parsed = storedValue === 'true';
          console.log(`[useUserPreference (${preferenceKeySuffix})] useState: Parsed boolean:`, parsed);
          return parsed as unknown as T;
        }
        try {
          console.log(`[useUserPreference (${preferenceKeySuffix})] useState: Attempting JSON.parse on:`, storedValue);
          const parsed = JSON.parse(storedValue);
          console.log(`[useUserPreference (${preferenceKeySuffix})] useState: Parsed non-boolean via JSON:`, parsed);
          return parsed as T;
        } catch (e) {
          if (typeof defaultValue === 'string') {
            console.warn(`[useUserPreference (${preferenceKeySuffix})] useState: JSON.parse failed for string, using raw value:`, storedValue, e);
            return storedValue as unknown as T; // Use raw string if JSON parse fails for string types
          }
          throw e; // Re-throw for other types or unexpected errors
        }
      } else {
        console.log(`[useUserPreference (${preferenceKeySuffix})] useState: No stored value, returning default.`);
      }
    } catch (error) {
      console.error(`[useUserPreference (${preferenceKeySuffix})] useState: Error reading or parsing preference '${key}' from localStorage:`, error);
    }
    return defaultValue;
  });

  // Effect to re-load from localStorage if userId becomes available OR if key changes
  useEffect(() => {
    console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect running. User ID:`, userId, 'Session Status:', sessionStatus);
    if (typeof window !== 'undefined' && userId && sessionStatus === 'authenticated') {
      const key = getPreferenceKey();
      if (!key) {
        console.warn(`[useUserPreference (${preferenceKeySuffix})] Load effect: Could not generate key (userId: ${userId}).`);
        return;
      }
      
      console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: Attempting to load for key:`, key);
      try {
        const storedValue = localStorage.getItem(key);
        console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: localStorage.getItem('${key}') returned:`, storedValue);
        if (storedValue !== null) {
          let newValue: T;
          if (typeof defaultValue === 'boolean') {
            newValue = (storedValue === 'true') as unknown as T;
          } else {
            try {
              newValue = JSON.parse(storedValue) as T;
            } catch (e) {
              if (typeof defaultValue === 'string') {
                console.warn(`[useUserPreference (${preferenceKeySuffix})] Load effect: JSON.parse failed for string, using raw value:`, storedValue, e);
                newValue = storedValue as unknown as T;
              } else {
                throw e;
              }
            }
          }
          console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: Parsed value:`, newValue);
          // Removed the conditional update (JSON.stringify compare) for now to ensure setValue is called.
          // This might cause an extra re-render if the value is indeed the same, but is safer for debugging.
          // It can be added back if performance becomes an issue.
          console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: Calling setValue with parsed value.`);
          setValue(newValue);
        } else {
            console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: No value in localStorage for key ${key}. Current state value:`, value);
            // If nothing in storage, should we reset to default?
            // This handles case where a preference was cleared from localStorage manually.
            // Let's ensure it resets to default if current value isn't already default.
            if (JSON.stringify(value) !== JSON.stringify(defaultValue)) {
                 console.log(`[useUserPreference (${preferenceKeySuffix})] Load effect: No stored value, and current value is not default. Resetting to default.`);
                 setValue(defaultValue);
            }
        }
      } catch (error) {
        console.error(`[useUserPreference (${preferenceKeySuffix})] Load effect: Error reading or parsing preference '${key}':`, error);
      }
    }
  }, [userId, preferenceKeySuffix, defaultValue, getPreferenceKey, sessionStatus]);

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
