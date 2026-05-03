'use client';

import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTodayCompletion, useWeeklyMomentum, useHabitsForDate } from '@/hooks/useHabits';
import { useHabitStore } from '@/store/useHabitStore';
import { CircularProgressRing } from './CircularProgressRing';
import { ActivityHeatmap } from './ActivityHeatmap';
import { TrendingUp, Award, Flame, Target, Zap } from 'lucide-react';

type TimeRange = 'week' | 'month' | 'year';

export function StatsView() {
  const selectedDate = useHabitStore((s) => s.selectedDate);
  const completion = useTodayCompletion(selectedDate);
  const momentum = useWeeklyMomentum();
  const habits = useHabitsForDate(selectedDate);
  const logs = useHabitStore(useShallow((s) => s.logs));
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // Calculate advanced stats
  const stats = useMemo(() => {
    const totalStreaks = habits.reduce((sum, h) => sum + h.streak.current, 0);
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak.longest), 0);
    const avgStreak = habits.length > 0 ? Math.round(totalStreaks / habits.length) : 0;

    // Calculate completion rate by day of week
    const dayCompletions = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    
    logs.forEach(log => {
      if (log.status === 'completed' || (log.count && log.count > 0)) {
        const date = new Date(log.date);
        const dayOfWeek = date.getDay();
        dayCompletions[dayOfWeek]++;
      }
    });

    habits.forEach(habit => {
      const habitLogs = logs.filter(l => l.habitId === habit.id);
      habitLogs.forEach(log => {
        if (log.status === 'completed' || (log.count && log.count > 0)) {
          const date = new Date(log.date);
          const dayOfWeek = date.getDay();
          dayTotals[dayOfWeek]++;
        }
      });
    });

    const bestDayIndex = dayCompletions.indexOf(Math.max(...dayCompletions));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const bestDay = dayCompletions[bestDayIndex] > 0 ? days[bestDayIndex] : 'N/A';

    // Count-based habits stats
    const countBasedHabits = habits.filter(h => h.targetCount && h.targetCount > 1);
    const totalCountCompletions = logs.reduce((sum, l) => sum + (l.count || 0), 0);

    // Calculate trend (this week vs last week)
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    const thisWeekLogs = logs.filter(l => {
      const d = new Date(l.date);
      return d >= thisWeekStart && (l.status === 'completed' || (l.count && l.count > 0));
    });
    const lastWeekLogs = logs.filter(l => {
      const d = new Date(l.date);
      return d >= lastWeekStart && d < thisWeekStart && (l.status === 'completed' || (l.count && l.count > 0));
    });

    const trend = lastWeekLogs.length > 0
      ? Math.round(((thisWeekLogs.length - lastWeekLogs.length) / lastWeekLogs.length) * 100)
      : 0;

    // Category breakdown
    const categoryCount: Record<string, number> = {};
    habits.forEach(h => {
      categoryCount[h.category] = (categoryCount[h.category] || 0) + 1;
    });

    return {
      totalStreaks,
      bestStreak,
      avgStreak,
      bestDay,
      countBasedHabits: countBasedHabits.length,
      totalCountCompletions,
      trend,
      categoryCount,
      dayCompletions,
    };
  }, [habits, logs]);

  return (
    <div className="space-y-6 pb-8 lg:pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {(['week', 'month', 'year'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                timeRange === range ? 'bg-accent text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bento-card flex flex-col items-center justify-center py-6">
          <CircularProgressRing percentage={completion.percentage} size={100} strokeWidth={6} label="Today" />
        </div>
        <div className="bento-card flex flex-col items-center justify-center py-6">
          <CircularProgressRing percentage={momentum} size={100} strokeWidth={6} color="#34d399" label="This Week" />
        </div>
        <div className="bento-card flex flex-col items-center justify-center py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className={`w-4 h-4 ${stats.trend >= 0 ? 'text-success' : 'text-danger'}`} />
              <span className={`text-2xl font-bold ${stats.trend >= 0 ? 'text-success' : 'text-danger'}`}>
                {stats.trend >= 0 ? '+' : ''}{stats.trend}%
              </span>
            </div>
            <p className="text-xs text-white/40">vs Last Week</p>
          </div>
        </div>
        <div className="bento-card flex flex-col items-center justify-center py-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-accent">{stats.avgStreak}</span>
            <p className="text-xs text-white/40">Avg Streak</p>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bento-card flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">{habits.length}</span>
            <p className="text-xs text-white/40">Active Habits</p>
          </div>
        </div>
        <div className="bento-card flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-warning" />
          </div>
          <div>
            <span className="text-xl font-bold text-warning">{stats.totalStreaks}</span>
            <p className="text-xs text-white/40">Total Streak Days</p>
          </div>
        </div>
        <div className="bento-card flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-success" />
          </div>
          <div>
            <span className="text-xl font-bold text-success">{stats.bestStreak}</span>
            <p className="text-xs text-white/40">Best Streak</p>
          </div>
        </div>
        <div className="bento-card flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-purple-400/15 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-xl font-bold text-purple-400">{stats.bestDay}</span>
            <p className="text-xs text-white/40">Best Day</p>
          </div>
        </div>
      </div>

      {/* Count-Based Stats (if applicable) */}
      {stats.countBasedHabits > 0 && (
        <div className="bento-card">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Count-Based Habits</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <span className="text-2xl font-bold text-blue-400">{stats.countBasedHabits}</span>
              <p className="text-xs text-white/40 mt-1">Count-Based Habits</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <span className="text-2xl font-bold text-blue-400">{stats.totalCountCompletions}</span>
              <p className="text-xs text-white/40 mt-1">Total Count Completions</p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      <div className="bento-card">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Activity Heatmap</h3>
        <ActivityHeatmap />
      </div>

      {/* Day of Week Performance */}
      <div className="bento-card">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Day of Week Performance</h3>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
            const maxVal = Math.max(...stats.dayCompletions, 1);
            const height = (stats.dayCompletions[i] / maxVal) * 100;
            return (
              <div key={day} className="text-center">
                <div className="h-24 flex items-end justify-center mb-2">
                  <div
                    className="w-full bg-accent/20 rounded-t-md transition-all duration-500"
                    style={{ height: `${height}%`, backgroundColor: `${height > 50 ? 'var(--accent)' : ''}` }}
                  />
                </div>
                <span className="text-xs text-white/40">{day}</span>
                <span className="text-xs text-white/60 font-medium block">{stats.dayCompletions[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit Breakdown */}
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">{habit.streak.current} day streak</span>
                <span className="text-xs text-white/40 w-10 text-right">{habit.streak.consistencyScore}%</span>
              </div>
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

      {/* Category Breakdown */}
      {Object.keys(stats.categoryCount).length > 0 && (
        <div className="bento-card">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Category Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats.categoryCount).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-sm text-white/60 capitalize">{category}</span>
                <span className="text-sm font-semibold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
