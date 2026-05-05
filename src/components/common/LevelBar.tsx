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

  const { progress } = useMemo(() => {
    let xpUsed = 0;
    for (let i = 1; i < level; i++) {
      xpUsed += getXPForLevel(i);
    }
    const xpInCurrentLevel = xp - xpUsed;
    const xpNeeded = getXPForLevel(level);
    return { progress: (xpInCurrentLevel / xpNeeded) * 100 };
  }, [xp, level]);

  const isCyberpunk = level >= 5;
  const isCinematic = level >= 10;

  const accentColor = isCinematic ? '#ec4899' : isCyberpunk ? '#06b6d4' : '#818cf8';
  const glowColor = isCinematic ? 'rgba(236, 72, 153, 0.4)' : isCyberpunk ? 'rgba(6, 182, 212, 0.4)' : 'rgba(129, 140, 248, 0.4)';

  return (
    <>
      <div 
        className="relative overflow-hidden cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-4 transition-colors hover:bg-white/10" 
        onClick={() => setShowDetails(true)}
      >
        {isCinematic && (
          <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay">
            <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
          </div>
        )}

        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
          <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-bold text-white">Level {level}</p>
            <p className="text-[0.65rem] text-white/50 font-mono">{xp} XP</p>
          </div>
          
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full relative"
              style={{ backgroundColor: accentColor }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 8px ${glowColor}` }}
              />
            </motion.div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-center">
           <Zap className="w-4 h-4 text-white/20" />
        </div>
      </div>

      <LevelDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
}
