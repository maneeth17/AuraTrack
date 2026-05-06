'use client';

import { useState, useEffect, useCallback } from 'react';

type AuraTheme = 'auto' | 'dawn' | 'focus' | 'midnight' | 'cyberpunk' | 'cinematic';

export function useAura() {
  const [themePreference, setThemePreferenceState] = useState<AuraTheme>('auto');
  const [currentAura, setCurrentAura] = useState<Exclude<AuraTheme, 'auto'>>('focus');

  // Time Logic
  const getAuraByTime = useCallback(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 10) return 'dawn';
    if (h >= 20 || h < 5) return 'midnight';
    return 'focus';
  }, []);

  // Update DOM without triggering re-render if we can help it
  const updateDOM = useCallback((aura: Exclude<AuraTheme, 'auto'>) => {
    if (typeof document !== 'undefined') {
      const current = document.documentElement.getAttribute('data-theme');
      if (current !== aura) {
        document.documentElement.setAttribute('data-theme', aura);
        setCurrentAura(aura);
      }
    }
  }, []);

  // Sync preference with state, DOM, LocalStorage, and Neon DB
  const setThemePreference = useCallback(async (newPref: AuraTheme) => {
    setThemePreferenceState(newPref);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auratrack-theme', newPref);
    }

    if (newPref === 'auto') {
      updateDOM(getAuraByTime());
    } else {
      updateDOM(newPref);
    }

    // Save to DB
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themePreference: newPref }),
      });
    } catch (err) {
      console.error('Failed to save theme preference', err);
    }
  }, [getAuraByTime, updateDOM]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      // First, try to get from localStorage to match the inline script state
      const localPref = localStorage.getItem('auratrack-theme') as AuraTheme | null;
      if (localPref) {
        setThemePreferenceState(localPref);
        if (localPref !== 'auto') {
          updateDOM(localPref);
        } else {
          updateDOM(getAuraByTime());
        }
      }

      // Then fetch from DB to ensure truth
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          if (data.themePreference && data.themePreference !== localPref) {
            setThemePreferenceState(data.themePreference);
            localStorage.setItem('auratrack-theme', data.themePreference);
            if (data.themePreference !== 'auto') {
              updateDOM(data.themePreference);
            } else {
              updateDOM(getAuraByTime());
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch theme preference', err);
      }
    };

    init();
  }, [getAuraByTime, updateDOM]);

  // Interval for 'auto' mode
  useEffect(() => {
    const interval = setInterval(() => {
      if (themePreference === 'auto') {
        const newAura = getAuraByTime();
        updateDOM(newAura);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [themePreference, getAuraByTime, updateDOM]);

  return {
    themePreference,
    currentAura,
    setThemePreference
  };
}
