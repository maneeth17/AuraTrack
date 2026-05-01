'use client';

import { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Check, X as XIcon, Heart, Zap, Brain, Dumbbell, BookOpen, Users, Sun, Moon, Droplets, Coffee, Target, Trophy, Music, Camera, Smile, Star, Shield, Flame, Pencil, Trash2, X, ChevronRight, Calendar, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { HabitWithStreak, Habit } from '@/types';
import { useHabitStore } from '@/store/useHabitStore';

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
  music: Music,
  camera: Camera,
  smile: Smile,
  star: Star,
  shield: Shield,
  flame: Flame,
};

interface SwipeableHabitCardProps {
  habit: HabitWithStreak;
  date: string;
  onOpenDetail: (habit: HabitWithStreak) => void;
}

export function SwipeableHabitCard({ habit, date, onOpenDetail }: SwipeableHabitCardProps) {
  const markHabit = useHabitStore((s) => s.markHabit);
  const toggleHabit = useHabitStore((s) => s.toggleHabit);

  const x = useMotionValue(0);
  const opacityRight = useTransform(x, [0, 80, 150], [0, 0.5, 1]);
  const opacityLeft = useTransform(x, [0, -80, -150], [0, 0.5, 1]);
  const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95]);

  const isCompleted = habit.todayStatus === 'completed';
  const IconComponent = iconMap[habit.icon];

  function handleDragEnd(_event: MouseEvent | TouchEvent, info: PanInfo) {
    if (info.offset.x > 100) {
      markHabit(habit.id, date, 'completed');
    } else if (info.offset.x < -100 && isCompleted) {
      toggleHabit(habit.id, date);
    }
  }

  function handleCheckboxClick() {
    if (isCompleted) {
      toggleHabit(habit.id, date);
    } else {
      markHabit(habit.id, date, 'completed');
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-4 bg-success/20 rounded-2xl"
        style={{ opacity: opacityRight }}
      >
        <span className="mr-2 text-xs font-medium text-success/80">Complete</span>
        <Check className="w-5 h-5 text-success" />
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center justify-start pl-4 bg-warning/20 rounded-2xl"
        style={{ opacity: opacityLeft }}
      >
        <XIcon className="w-5 h-5 text-warning" />
        <span className="ml-2 text-xs font-medium text-warning/80">Uncheck</span>
      </motion.div>

      <motion.div
        style={{ x, scale }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={isCompleted ? { scale: 1.02 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative glass rounded-2xl p-4 cursor-grab active:cursor-grabbing"
      >
        <div
          className="flex items-center gap-3"
          onClick={() => onOpenDetail(habit)}
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{ backgroundColor: `${habit.color}20` }}
          >
            {IconComponent && <IconComponent className="w-5 h-5" style={{ color: habit.color }} />}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm truncate ${isCompleted ? 'line-through text-white/40' : 'text-white/90'}`}>
              {habit.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-white/40">{habit.category}</span>
              {habit.streak.current > 0 && (
                <>
                  <span className="text-white/20">&middot;</span>
                  <span className="text-xs text-warning flex items-center gap-0.5">
                    <Flame className="w-3 h-3" />
                    {habit.streak.current}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const event = new CustomEvent('delete-habit', { detail: habit.id });
              window.dispatchEvent(event);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 opacity-40 hover:opacity-100 hover:bg-danger/20 text-white/40 hover:text-danger"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCheckboxClick();
            }}
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
              isCompleted
                ? 'border-success bg-success/20 hover:bg-success/30'
                : 'border-white/20 hover:border-accent/50 hover:bg-accent/10'
            }`}
          >
            {isCompleted && <Check className="w-4 h-4 text-success" />}
          </button>

          <ChevronRight className="w-4 h-4 text-white/20 shrink-0 hidden lg:block" />
        </div>
      </motion.div>
    </div>
  );
}

interface HabitDetailSheetProps {
  habit: HabitWithStreak | null;
  date: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
}

export function HabitDetailSheet({ habit, isOpen, onClose, onEdit }: HabitDetailSheetProps & { date?: string }) {
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!habit) return null;

  const IconComponent = iconMap[habit.icon] || Heart;

  const createdDate = new Date(habit.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${habit.color}20` }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color: habit.color }} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{habit.title}</h2>
                        <p className="text-xs text-white/40">{habit.category} · {habit.frequency}</p>
                      </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-5">
                  {habit.description && (
                    <div>
                      <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">About</h4>
                      <p className="text-sm text-white/70 leading-relaxed">{habit.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <TrendingUp className="w-4 h-4 text-warning mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{habit.streak.current}</p>
                      <p className="text-[0.65rem] text-white/40">Current Streak</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <Award className="w-4 h-4 text-success mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{habit.streak.longest}</p>
                      <p className="text-[0.65rem] text-white/40">Best Streak</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <Calendar className="w-4 h-4 text-accent mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{habit.streak.consistencyScore}%</p>
                      <p className="text-[0.65rem] text-white/40">Consistency</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-white/50">Created</span>
                    <span className="text-sm text-white/70">{createdDate}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-white/50">Frequency</span>
                    <span className="text-sm text-white/70 capitalize">{habit.frequency}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-white/50">Color</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: habit.color }} />
                      <span className="text-sm text-white/70 font-mono text-xs">{habit.color}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        setTimeout(() => onEdit(habit), 300);
                      }}
                      className="flex-1 py-3 rounded-xl border border-accent/30 bg-accent/10 text-sm font-medium text-accent hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex-1 py-3 rounded-xl border border-danger/30 bg-danger/10 text-sm font-medium text-danger hover:bg-danger/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-full max-w-sm bg-surface border border-white/10 rounded-2xl p-6 pointer-events-auto shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-danger/15 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Delete Habit</h3>
                    <p className="text-xs text-white/40">This cannot be undone</p>
                  </div>
                </div>

                <p className="text-sm text-white/60 mb-6">
                  Are you sure you want to delete <span className="text-white font-medium">&quot;{habit.title}&quot;</span>? All tracking data will be lost.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-white/60 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      deleteHabit(habit.id);
                      setShowDeleteConfirm(false);
                      onClose();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-danger/20 border border-danger/30 text-sm font-medium text-danger hover:bg-danger/30 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
