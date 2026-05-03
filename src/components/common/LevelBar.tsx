'use client';

import { useMemo, useState } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import { useShallow } from 'zustand/react/shallow';
import { getXPForLevel } from '@/types';
import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import { LevelDetailsModal } from './LevelDetailsModal';

export function LevelBar() {
  const [xp, level] = useHabitStore(useShallow((s) => [s.xp, s.level]));
  const [showDetails, setShowDetails] = useState(false);

  const { progress, totalXPForCurrentLevel, xpForNextLevel } = useMemo(() => {
    let xpUsed = 0;
    for (let i = 1; i < level; i++) {
      xpUsed += getXPForLevel(i);
    }
    const xpInCurrentLevel = xp - xpUsed;
    const xpNeeded = getXPForLevel(level);
    return {
      progress: (xpInCurrentLevel / xpNeeded) * 100,
      totalXPForCurrentLevel: xpInCurrentLevel,
      xpForNextLevel: xpNeeded - xpInCurrentLevel,
    };
  }, [xp, level]);

  const isCyberpunk = level >= 5;
  const isCinematic = level >= 10;

  const accentColor = isCinematic ? '#ec4899' : isCyberpunk ? '#06b6d4' : '#818cf8';
  const glowColor = isCinematic ? 'rgba(236, 72, 153, 0.4)' : isCyberpunk ? 'rgba(6, 182, 212, 0.4)' : 'rgba(129, 140, 248, 0.4)';

  return (
    <>
      <div className="bento-card relative overflow-hidden cursor-pointer" onClick={() => setShowDetails(true)}>
        {isCinematic && (
          <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay">
            <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
              <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-xs text-white/40">Level</p>
              <p className="text-lg font-bold text-white">{level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">XP</p>
            <p className="text-sm font-mono text-white/70">{xp}</p>
          </div>
        </div>

        <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full relative"
            style={{ backgroundColor: accentColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 12px ${glowColor}, 0 0 24px ${glowColor}` }}
            />
          </motion.div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-[0.65rem] text-white/30">
            {Math.round(totalXPForCurrentLevel)} / {getXPForLevel(level)} XP
          </p>
          <p className="text-[0.65rem] text-white/30 flex items-center gap-1">
            <Zap className="w-3 h-3" style={{ color: accentColor }} />
            {Math.round(xpForNextLevel)} to next level
          </p>
        </div>

        {isCyberpunk && (
          <div className="mt-2 text-[0.6rem] text-cyan-400/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Cyberpunk theme unlocked
          </div>
        )}
        {isCinematic && (
          <div className="mt-1 text-[0.6rem] text-pink-400/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Cinematic theme unlocked
          </div>
        )}
      </div>

      <LevelDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
}
