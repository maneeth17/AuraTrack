'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { generateMotivation, MotivationRequest } from '@/app/actions';
import { useHabitStore } from '@/store/useHabitStore';
import Typewriter from 'typewriter-effect';

const CACHE_KEY = 'auratrack-ai-motivation';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  message: string;
  date: string;
  expiresAt: number;
  completionPercentage: number;
}

function getCachedMotivation(currentCompletion: number): { message: string; percentage: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const entry: CacheEntry = JSON.parse(cached);
    
    // Invalidate if completion changed at all
    if (currentCompletion !== entry.completionPercentage) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return { message: entry.message, percentage: entry.completionPercentage };
  } catch {
    return null;
  }
}

function setCachedMotivation(message: string, date: string, completionPercentage: number) {
  if (typeof window === 'undefined') return;
  const entry: CacheEntry = {
    message,
    date,
    expiresAt: Date.now() + CACHE_DURATION,
    completionPercentage,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

export function AIMotivation() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMotivation = useCallback(async () => {
    try {
      const state = useHabitStore.getState();
      const { habits, logs, xp, level } = state;
      const today = new Date().toISOString().split('T')[0];
      const completedToday = logs.filter(
        (log) => log.date === today && log.status === 'completed'
      );
      const completionPercentage =
        habits.length > 0
          ? Math.round((completedToday.length / habits.length) * 100)
          : 0;

      // Check cache first
      const cached = getCachedMotivation(completionPercentage);
      if (cached && cached.message) {
        setMessage(cached.message);
        setIsVisible(true);
        return;
      }

      setIsLoading(true);

	      const data: MotivationRequest = {
        habits: habits.map((h) => ({
          title: h.title,
          streak: 0,
          completed: completedToday.some((log) => log.habitId === h.id),
        })),
        completionPercentage,
        totalXP: xp,
        level,
      };

      const result = await generateMotivation(data);
      setMessage(result.message);
      setCachedMotivation(result.message, result.date, completionPercentage);
      setIsVisible(true);
    } catch (error) {
      console.error('[AIMotivation] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to log changes (debounced)
  useEffect(() => {
    const unsubscribe = useHabitStore.subscribe(
      (newState, prevState) => {
        // Only trigger if logs actually changed
        if (newState.logs !== prevState.logs) {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            fetchMotivation();
          }, 1500); // 1.5s debounce
        }
      }
    );
    return () => {
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchMotivation]);

  // Initial fetch after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMotivation();
    }, 2000);
    return () => clearTimeout(timer);
  }, [fetchMotivation]);

  if (!isVisible && !isLoading) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 animate-fade-in">
      <div className="glass glass-blur rounded-2xl px-5 py-4 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-accent/80 uppercase tracking-wider">
            AI Coach
          </span>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-foreground/40">
            <div className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-pulse" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : message ? (
          <div className="text-sm text-foreground/90 leading-relaxed min-h-[24px]">
            <Typewriter
              key={message} // Force re-render on new message
              options={{
                strings: [message],
                autoStart: true,
                loop: false,
                delay: 30,
                cursor: '_',
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
