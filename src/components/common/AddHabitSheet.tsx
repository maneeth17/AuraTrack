'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Heart, Zap, Brain, Dumbbell, BookOpen, Users, Sun, Moon, Droplets, Coffee, Target, Trophy, Music, Camera, Smile, Star, Shield, Flame, Timer } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import { CATEGORIES, HABIT_ICONS, HABIT_COLORS } from '@/lib/streak';
import { Habit } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
  music: Music,
  camera: Camera,
  smile: Smile,
  star: Star,
  shield: Shield,
  flame: Flame,
};

interface AddHabitSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editHabit: Habit | null;
}

export function AddHabitSheet({ isOpen, onClose, editHabit }: AddHabitSheetProps) {
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Health');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [icon, setIcon] = useState(HABIT_ICONS[0]);
  const [isFocusHabit, setIsFocusHabit] = useState(false);
  const [enableCountTracking, setEnableCountTracking] = useState(false);
  const [targetCount, setTargetCount] = useState(8);

  useEffect(() => {
    if (editHabit) {
      setTitle(editHabit.title);
      setDescription(editHabit.description);
      setCategory(editHabit.category);
      setFrequency(editHabit.frequency);
      setColor(editHabit.color);
      setIcon(editHabit.icon);
      setIsFocusHabit(editHabit.isFocusHabit || false);
      setEnableCountTracking((editHabit.targetCount || 0) > 1);
      setTargetCount(editHabit.targetCount || 8);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Health');
      setFrequency('daily');
      setColor(HABIT_COLORS[0]);
      setIcon(HABIT_ICONS[0]);
      setIsFocusHabit(false);
      setEnableCountTracking(false);
      setTargetCount(8);
    }
  }, [editHabit, isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    const habitData: Partial<Habit> = {
      title,
      description,
      category,
      frequency,
      color,
      icon,
      isFocusHabit,
    };

    if (enableCountTracking && targetCount > 1) {
      habitData.targetCount = targetCount;
      habitData.currentCount = 0;
    } else {
      habitData.targetCount = undefined;
      habitData.currentCount = 0;
    }

    if (editHabit) {
      updateHabit(editHabit.id, habitData);
    } else {
      addHabit({
        ...habitData,
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      } as Omit<Habit, 'id' | 'createdAt'>);
    }
    onClose();
  };

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
            <div className="w-full lg:max-w-lg bg-surface border border-white/10 rounded-t-3xl lg:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto shadow-2xl">
              <div className="shrink-0 bg-surface/80 backdrop-blur-md px-5 pt-4 pb-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">
                    {editHabit ? 'Edit Habit' : 'New Habit'}
                  </h2>
                  <button onClick={onClose} className="min-h-[44px] min-w-[44px] rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-5">
                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Name</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Morning Meditation"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Why is this habit important?"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setCategory(cat.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          category === cat.name
                            ? 'border'
                            : 'border border-white/10 bg-white/5 text-white/50'
                        }`}
                        style={category === cat.name ? { borderColor: cat.color, color: cat.color, backgroundColor: `${cat.color}15` } : {}}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Frequency</label>
                  <div className="flex gap-2">
                    {(['daily', 'weekly'] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setFrequency(freq)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          frequency === freq
                            ? 'bg-accent/20 border border-accent/40 text-accent'
                            : 'bg-white/5 border border-white/10 text-white/50'
                        }`}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Focus Habit</label>
                  <button
                    type="button"
                    onClick={() => setIsFocusHabit(!isFocusHabit)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      isFocusHabit
                        ? 'border-accent/30 bg-accent/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Timer className={`w-5 h-5 ${isFocusHabit ? 'text-accent' : 'text-white/30'}`} />
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isFocusHabit ? 'text-accent' : 'text-white/60'}`}>Enable Pomodoro Timer</p>
                      <p className="text-xs text-white/30">Complete a 25-min session to check off</p>
                    </div>
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Count Tracking</label>
                  <button
                    type="button"
                    onClick={() => setEnableCountTracking(!enableCountTracking)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      enableCountTracking
                        ? 'border-accent/30 bg-accent/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Target className={`w-5 h-5 ${enableCountTracking ? 'text-accent' : 'text-white/30'}`} />
                    <div className="text-left flex-1">
                      <p className={`text-sm font-medium ${enableCountTracking ? 'text-accent' : 'text-white/60'}`}>Enable Count Tracking</p>
                      <p className="text-xs text-white/30">Track multiple completions per day</p>
                    </div>
                  </button>

                  {enableCountTracking && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                        <Target className="w-5 h-5 text-accent shrink-0" />
                        <div className="flex-1">
                          <label className="text-xs text-white/40">Target Count</label>
                          <input
                            type="number"
                            min="2"
                            max="100"
                            value={targetCount}
                            onChange={(e) => setTargetCount(Math.max(2, parseInt(e.target.value) || 2))}
                            className="w-full bg-transparent text-white text-sm font-medium focus:outline-none"
                          />
                        </div>
                        <span className="text-xs text-white/40">per day</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110' : 'opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_ICONS.map((ic) => {
                      const IconComp = iconMap[ic];
                      if (!IconComp) return null;
                      return (
                        <button
                          key={ic}
                          onClick={() => setIcon(ic)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            icon === ic
                              ? 'bg-accent/20 border border-accent/40'
                              : 'bg-white/5 border border-white/10'
                          }`}
                          style={icon === ic ? { color } : { color: 'rgba(255,255,255,0.4)' }}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="shrink-0 px-5 pb-5 pt-3 border-t border-white/5">
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  {editHabit ? 'Update Habit' : 'Create Habit'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
