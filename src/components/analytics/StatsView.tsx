'use client';

import { useTodayCompletion, useWeeklyMomentum, useHabitsForDate } from '@/hooks/useHabits';
import { useHabitStore } from '@/store/useHabitStore';
import { CircularProgressRing } from './CircularProgressRing';
import { ActivityHeatmap } from './ActivityHeatmap';
import { TrendingUp, Award, Flame } from 'lucide-react';

export function StatsView() {
  const selectedDate = useHabitStore((s) => s.selectedDate);
  const completion = useTodayCompletion(selectedDate);
  const momentum = useWeeklyMomentum();
  const habits = useHabitsForDate(selectedDate);

  const totalStreaks = habits.reduce((sum, h) => sum + h.streak.current, 0);
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak.longest), 0);

  return (
    <div className="space-y-6 pb-8 lg:pb-4">
      <h2 className="text-2xl font-bold text-white">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bento-card flex flex-col items-center justify-center py-8">
          <CircularProgressRing percentage={completion.percentage} size={120} strokeWidth={8} label="Today" />
        </div>
        <div className="bento-card flex flex-col items-center justify-center py-8">
          <CircularProgressRing percentage={momentum} size={120} strokeWidth={8} color="#34d399" label="This Week" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bento-card flex items-center gap-4 py-5">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">{habits.length}</span>
            <p className="text-xs text-white/40">Active Habits</p>
          </div>
        </div>
        <div className="bento-card flex items-center gap-4 py-5">
          <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
            <Flame className="w-5 h-5 text-warning" />
          </div>
          <div>
            <span className="text-xl font-bold text-warning">{totalStreaks}</span>
            <p className="text-xs text-white/40">Total Streak</p>
          </div>
        </div>
        <div className="bento-card flex items-center gap-4 py-5">
          <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
            <Award className="w-5 h-5 text-success" />
          </div>
          <div>
            <span className="text-xl font-bold text-success">{bestStreak}</span>
            <p className="text-xs text-white/40">Best Streak</p>
          </div>
        </div>
      </div>

      <div className="bento-card">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Activity Heatmap</h3>
        <ActivityHeatmap />
      </div>

      <div className="bento-card">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Habit Breakdown</h3>
        <div className="space-y-3">
          {habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: habit.color }}
              />
              <span className="text-sm text-white/60 flex-1 truncate">{habit.title}</span>
              <span className="text-xs text-white/40 w-10 text-right">{habit.streak.consistencyScore}%</span>
              <div className="w-20 lg:w-28 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${habit.streak.consistencyScore}%`, backgroundColor: habit.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
