'use client';

import { useHabitStore } from '@/store/useHabitStore';
import { useEffect, useRef, useCallback } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const level = useHabitStore((s) => s.level);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pillar 4: Disable backdrop-filter while scrolling for performance
  const handleScroll = useCallback(() => {
    document.documentElement.classList.add('is-scrolling');
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      document.documentElement.classList.remove('is-scrolling');
    }, 150);
  }, []);

  useEffect(() => {
    // Level-based themes are now manually selectable in Settings once unlocked.
    // We only handle performance class toggling here.
  }, [level]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      document.documentElement.classList.remove('is-scrolling');
    };
  }, [handleScroll]);

  return <>{children}</>;
}
