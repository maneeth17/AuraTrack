'use client';

import { useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useHabitIds, useTodayCompletion } from '@/hooks/useHabits';
import { SwipeableHabitCard } from './SwipeableHabitCard';
import { HabitWithStreak } from '@/types';
import { hapticVibrate } from '@/lib/haptics';

interface HabitBentoGridProps {
  date: string;
  onOpenDetail: (habit: HabitWithStreak) => void;
}

export function HabitBentoGrid({ date, onOpenDetail }: HabitBentoGridProps) {
  const habitIds = useHabitIds();
  const completion = useTodayCompletion(date);
  const hasTriggeredRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (habitIds.length > 0 && completion.percentage >= 100) {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        void triggerConfetti();
      }
    } else if (completion.percentage < 100) {
      hasTriggeredRef.current = false;
    }
  }, [completion.percentage, habitIds.length]);

  const handleComplete = useCallback(() => {
    hapticVibrate([10], 'habit-complete');
  }, []);

  if (habitIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-white/40 text-sm">No habits yet</p>
        <p className="text-white/20 text-xs mt-1">Tap + to create your first habit</p>
      </div>
    );
  }

  const springConfig = shouldReduceMotion ? { duration: 0.1 } : { type: 'spring' as const, stiffness: 400, damping: 30 };

  return (
    <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 gpu-accelerated main-scroll-container">
      <AnimatePresence mode="popLayout">
        {habitIds.map((habitId) => (
          <motion.div
            key={habitId}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={springConfig}
            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}
          >
            <SwipeableHabitCard
              habitId={habitId}
              date={date}
              onOpenDetail={onOpenDetail}
              onComplete={handleComplete}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

async function triggerConfetti() {
  hapticVibrate([50, 30, 50], 'confetti');

  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default || confettiModule;

    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        startVelocity: 40,
        origin: { x: 0, y: 0.7 },
        colors: ['#818cf8', '#34d399', '#f472b6', '#fbbf24'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        startVelocity: 40,
        origin: { x: 1, y: 0.7 },
        colors: ['#818cf8', '#34d399', '#f472b6', '#fbbf24'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch {
    // Confetti failed to load silently
  }
}
