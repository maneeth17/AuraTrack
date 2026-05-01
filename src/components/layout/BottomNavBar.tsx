'use client';

import { motion } from 'framer-motion';
import { Home, BarChart3, Settings, Plus } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFabPress: () => void;
}

export function BottomNavBar({ activeTab, onTabChange, onFabPress }: BottomNavBarProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="mx-4 mb-4">
        <div className="glass rounded-2xl px-2 py-2 flex items-center justify-around relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-5 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-accent' : 'text-white/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-accent/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" />
                <span className="text-[0.6rem] font-medium mt-0.5 relative z-10">{tab.label}</span>
              </button>
            );
          })}

          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={onFabPress}
              className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-glow-lg fab-glow"
            >
              <Plus className="w-7 h-7 text-white" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
