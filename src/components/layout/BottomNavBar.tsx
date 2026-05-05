'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, BarChart3, Settings, Plus, Zap } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFabPress: () => void;
}

export const BottomNavBar = memo(function BottomNavBar({ activeTab, onTabChange, onFabPress }: BottomNavBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const springConfig = shouldReduceMotion ? { duration: 0.1 } : { type: 'spring' as const, stiffness: 400, damping: 30 };

  const tabsLeft = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
  ];

  const tabsRight = [
    { id: 'lab', icon: Zap, label: 'Lab' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const renderTab = (tab: { id: string; icon: React.ElementType; label: string }) => {
    const isActive = activeTab === tab.id;
    const Icon = tab.icon;
    return (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`relative flex flex-col items-center justify-center py-2.5 px-4 sm:px-5 rounded-full transition-all duration-300 min-h-[48px] min-w-[48px] ${
          isActive ? 'text-accent' : 'text-white/40 hover:text-white/70'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-accent/15 rounded-full"
            transition={springConfig}
          />
        )}
        <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom pb-4 px-4 pointer-events-none">
      <div className="glass rounded-full p-1.5 flex items-center justify-between relative shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 max-w-[360px] mx-auto pointer-events-auto backdrop-blur-xl">
        <div className="flex items-center gap-1">
          {tabsLeft.map(renderTab)}
        </div>

        <motion.button
          whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
          onClick={onFabPress}
          className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-shadow mx-1 flex-shrink-0"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>

        <div className="flex items-center gap-1">
          {tabsRight.map(renderTab)}
        </div>
      </div>
    </div>
  );
});
