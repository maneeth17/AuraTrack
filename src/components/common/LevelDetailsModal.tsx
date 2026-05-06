'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Sparkles, Zap } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import { getXPForLevel } from '@/types';
import { useShallow } from 'zustand/react/shallow';

interface LevelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LevelDetailsModal({ isOpen, onClose }: LevelDetailsModalProps) {
  const [xp, level] = useHabitStore(useShallow((s) => [s.xp, s.level]));

  const totalXPForCurrentLevel = (() => {
    let xpUsed = 0;
    for (let i = 1; i < level; i++) {
      xpUsed += getXPForLevel(i);
    }
    return xp - xpUsed;
  })();

  const xpForNextLevel = getXPForLevel(level) - totalXPForCurrentLevel;

  const isCyberpunk = level >= 5;
  const isCinematic = level >= 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center pointer-events-none p-0 lg:p-4"
          >
            <div className="w-full lg:max-w-md bg-surface border border-white/10 rounded-t-3xl lg:rounded-3xl max-h-[90vh] lg:max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto shadow-2xl">
              <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Level {level}</h2>
                      <p className="text-xs text-foreground/40">{xp} total XP</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4 text-foreground/60" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground/60">Progress to Level {level + 1}</span>
                    <span className="text-xs text-foreground/40">{Math.round(totalXPForCurrentLevel)} / {getXPForLevel(level)} XP</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(totalXPForCurrentLevel / getXPForLevel(level)) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-foreground/30 mt-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {Math.round(xpForNextLevel)} XP needed for next level
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5">
                  <h4 className="text-sm font-semibold text-foreground/80 mb-3">XP Sources</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/50">Habit completion</span>
                      <span className="text-foreground/70">10 XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/50">5-day streak bonus</span>
                      <span className="text-foreground/70">50 XP</span>
                    </div>
                  </div>
                </div>

                {isCyberpunk && (
                  <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">Cyberpunk Theme Unlocked</span>
                    </div>
                  </div>
                )}

                {isCinematic && (
                  <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/20">
                    <div className="flex items-center gap-2 text-pink-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">Cinematic Theme Unlocked</span>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-white/5">
                  <h4 className="text-sm font-semibold text-foreground/80 mb-3">Upcoming Rewards</h4>
                  {level < 5 && (
                    <p className="text-xs text-foreground/40">Reach Level 5 to unlock Cyberpunk theme</p>
                  )}
                  {level >= 5 && level < 10 && (
                    <p className="text-xs text-foreground/40">Reach Level 10 to unlock Cinematic theme</p>
                  )}
                {level >= 10 && (
                  <p className="text-xs text-foreground/40">You&apos;ve unlocked all themes! Keep going!</p>
                )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
