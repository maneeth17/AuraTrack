'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import { useShallow } from 'zustand/react/shallow';
import confetti from 'canvas-confetti';

export function LevelUpOverlay() {
  const [level, hasHydrated] = useHabitStore(useShallow((s) => [s.level, s.hasHydrated]));
  const [show, setShow] = useState(false);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    if (!hasHydrated) {
      prevLevelRef.current = level;
      return;
    }

    if (level > prevLevelRef.current && prevLevelRef.current > 0) {
      setShow(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#818cf8', '#ec4899', '#06b6d4'],
      });

      const timer = setTimeout(() => setShow(false), 3000);
      prevLevelRef.current = level;
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = level;
  }, [level, hasHydrated]);

  const handleDismiss = () => {
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 safe-top safe-bottom cursor-pointer"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="text-center w-full max-w-sm mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: 1 }}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-accent/20 flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl font-bold text-foreground mb-2"
            >
              Level {level}
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg text-foreground/60 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              Level Up!
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-foreground/40 mt-4"
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
