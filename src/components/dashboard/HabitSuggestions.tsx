'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Heart, Zap, Brain, Dumbbell, BookOpen, Users, Sun, Droplets, Target, Trophy, Coffee, Moon } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';

const SUGGESTED_HABITS = [
  { title: 'Morning Meditation', description: '10 minutes of mindfulness', category: 'Mindfulness', icon: 'brain', color: '#a78bfa' },
  { title: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day', category: 'Health', icon: 'droplets', color: '#38bdf8' },
  { title: 'Exercise 30 Min', description: 'Cardio or strength training', category: 'Fitness', icon: 'dumbbell', color: '#fb923c' },
  { title: 'Read 20 Pages', description: 'Build knowledge daily', category: 'Learning', icon: 'book', color: '#38bdf8' },
  { title: 'No Phone Before Bed', description: 'Better sleep hygiene', category: 'Health', icon: 'moon', color: '#a78bfa' },
  { title: 'Journal Daily', description: 'Write 3 things you are grateful for', category: 'Mindfulness', icon: 'heart', color: '#f472b6' },
  { title: 'Deep Work Session', description: '90 minutes of focused work', category: 'Productivity', icon: 'target', color: '#818cf8' },
  { title: 'Call a Friend', description: 'Maintain social connections', category: 'Social', icon: 'users', color: '#f472b6' },
  { title: 'Morning Stretch', description: '5 minutes of flexibility work', category: 'Fitness', icon: 'zap', color: '#34d399' },
  { title: 'No Sugar Today', description: 'Clean eating challenge', category: 'Health', icon: 'heart', color: '#34d399' },
  { title: 'Practice Gratitude', description: 'List 3 good things', category: 'Mindfulness', icon: 'smile', color: '#fbbf24' },
  { title: 'Learn Something New', description: 'Watch a tutorial or read an article', category: 'Learning', icon: 'trophy', color: '#fbbf24' },
];

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  heart: Heart,
  zap: Zap,
  brain: Brain,
  dumbbell: Dumbbell,
  book: BookOpen,
  users: Users,
  sun: Sun,
  moon: Moon,
  droplets: Droplets,
  coffee: Coffee,
  target: Target,
  trophy: Trophy,
  smile: Heart,
};

interface HabitSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HabitSuggestions({ isOpen, onClose }: HabitSuggestionsProps) {
  const addHabit = useHabitStore((s) => s.addHabit);
  const habits = useHabitStore((s) => s.habits);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const existingTitles = new Set(habits.map((h) => h.title));

  function handleAddSelected() {
    selected.forEach((title) => {
      const suggestion = SUGGESTED_HABITS.find((s) => s.title === title);
      if (suggestion) {
        addHabit({
          title: suggestion.title,
          description: suggestion.description,
          category: suggestion.category,
          frequency: 'daily',
          days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          color: suggestion.color,
          icon: suggestion.icon,
        });
      }
    });
    setSelected(new Set());
    onClose();
  }

  function handleToggle(title: string) {
    const next = new Set(selected);
    if (next.has(title)) {
      next.delete(title);
    } else {
      next.add(title);
    }
    setSelected(next);
  }

  const availableHabits = SUGGESTED_HABITS.filter((h) => !existingTitles.has(h.title));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-end lg:items-center justify-center pointer-events-none"
          >
            <div className="w-full lg:max-w-lg bg-surface border border-white/10 rounded-t-3xl lg:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto shadow-2xl">
              <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-white">Quick Start</h2>
                  <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                <p className="text-sm text-white/40">Choose habits to start tracking today. Tap to add instantly, or select multiple below.</p>
              </div>

              <div className="overflow-y-auto flex-1 p-5">
                <div className="grid grid-cols-2 gap-3">
                  {availableHabits.map((suggestion) => {
                    const IconComp = iconMap[suggestion.icon] || Heart;
                    const isSelected = selected.has(suggestion.title);

                    return (
                      <button
                        key={suggestion.title}
                        onClick={() => handleToggle(suggestion.title)}
                        className={`relative flex flex-col items-start p-3.5 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'border-accent/40 bg-accent/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${suggestion.color}20` }}
                          >
                            <IconComp className="w-4 h-4" style={{ color: suggestion.color }} />
                          </div>
                          {isSelected && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-white/90 leading-tight">{suggestion.title}</p>
                        <p className="text-[0.65rem] text-white/30 mt-0.5 line-clamp-2">{suggestion.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {availableHabits.length > 0 && (
                <div className="shrink-0 px-5 pb-5 pt-3 border-t border-white/5 space-y-2">
                  {selected.size > 0 ? (
                    <button
                      onClick={handleAddSelected}
                      className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Add {selected.size} Habit{selected.size > 1 ? 's' : ''}
                    </button>
                  ) : (
                    <p className="text-center text-xs text-white/30">Tap a card to select, then add below</p>
                  )}
                </div>
              )}

              {availableHabits.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-white/50">All suggested habits already added!</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
