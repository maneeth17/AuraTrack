'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import confetti from 'canvas-confetti';

export function LevelUpOverlay() {
  const level = useHabitStore((s) => s.level);
  const [show, setShow] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);

  useEffect(() => {
    if (level > prevLevel && prevLevel > 0) {
      setShow(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#818cf8', '#ec4899', '#06b6d4'],
      });

      const timer = setTimeout(() => setShow(false), 3000);
      setPrevLevel(level);
      return () => clearTimeout(timer);
    }
    setPrevLevel(level);
  }, [level, prevLevel]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: 1 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center"
            >
              <Sparkles className="w-10 h-10 text-accent" />
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-bold text-white mb-2"
            >
              Level {level}
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-white/60 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 text-accent" />
              Level Up!
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
