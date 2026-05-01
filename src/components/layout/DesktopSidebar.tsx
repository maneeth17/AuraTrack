'use client';

import { Home, BarChart3, Settings, Plus, Zap } from 'lucide-react';

interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddHabit: () => void;
}

export function DesktopSidebar({ activeTab, onTabChange, onAddHabit }: DesktopSidebarProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'stats', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-surface/50 border-r border-white/5 backdrop-blur-xl flex-col p-6 z-40">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
          <Zap className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">AuraTrack</h1>
          <p className="text-xs text-white/30">Build better habits</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/5">
        <button
          onClick={onAddHabit}
          className="w-full btn-primary py-3.5 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Habit
        </button>
      </div>
    </aside>
  );
}
