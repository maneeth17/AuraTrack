import { useMemo } from 'react';
import { useHabitStore } from '@/store/useHabitStore';

interface HabitPair {
  habitA: string;
  habitB: string;
  coCompleted: number;
  totalDays: number;
  correlation: number;
}

interface DayAnalysis {
  day: string;
  completed: number;
  total: number;
  rate: number;
}

interface PatternAnalysis {
  longestStreak: { habitId: string; habitTitle: string; streak: number };
  bestDay: DayAnalysis;
  habitPairs: HabitPair[];
  weeklyTrend: number[];
  totalDays: number;
  completionRate: number;
  mostConsistentHabit: { habitId: string; habitTitle: string; rate: number };
  habitsNeedingAttention: { habitId: string; habitTitle: string; rate: number }[];
}

export function usePatternAnalysis(): PatternAnalysis {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);

  return useMemo(() => {
    const habitMap = new Map(habits.map((h) => [h.id, h.title]));

    const completedByDate = new Map<string, Set<string>>();
    const habitCompletedDates = new Map<string, Set<string>>();

    for (const log of logs) {
      if (log.status === 'completed') {
        if (!completedByDate.has(log.date)) {
          completedByDate.set(log.date, new Set());
        }
        completedByDate.get(log.date)!.add(log.habitId);

        if (!habitCompletedDates.has(log.habitId)) {
          habitCompletedDates.set(log.habitId, new Set());
        }
        habitCompletedDates.get(log.habitId)!.add(log.date);
      }
    }

    const allDates = Array.from(completedByDate.keys()).sort();
    const totalDays = allDates.length;

    // Longest streak per habit
    let longestStreak = { habitId: '', habitTitle: '—', streak: 0 };

    for (const [habitId, dates] of Array.from(habitCompletedDates.entries())) {
      const sortedDates = Array.from(dates).sort();
      let currentStreak = 1;
      let maxStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }

      if (maxStreak > longestStreak.streak) {
        longestStreak = { habitId, habitTitle: habitMap.get(habitId) || '—', streak: maxStreak };
      }
    }

    // Best day of week
    const dayStats = new Map<string, { completed: number; total: number }>();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (const date of allDates) {
      const dayOfWeek = daysOfWeek[new Date(date).getDay()];
      const dayCompleted = completedByDate.get(date)?.size || 0;

      if (!dayStats.has(dayOfWeek)) {
        dayStats.set(dayOfWeek, { completed: 0, total: 0 });
      }
      const stats = dayStats.get(dayOfWeek)!;
      stats.completed += dayCompleted;
      stats.total += habits.length;
    }

    let bestDay = { day: '—', completed: 0, total: 0, rate: 0 };
    for (const [day, stats] of Array.from(dayStats.entries())) {
      const rate = stats.total > 0 ? stats.completed / stats.total : 0;
      if (rate > bestDay.rate) {
        bestDay = { day, completed: stats.completed, total: stats.total, rate };
      }
    }

    // Habit coupling
    const habitIds = habits.map((h) => h.id);
    const habitPairs: HabitPair[] = [];

    for (let i = 0; i < habitIds.length; i++) {
      for (let j = i + 1; j < habitIds.length; j++) {
        const datesA = habitCompletedDates.get(habitIds[i]) || new Set();
        const datesB = habitCompletedDates.get(habitIds[j]) || new Set();
        const coCompleted = Array.from(datesA).filter((d) => datesB.has(d)).length;
        const unionDates = new Set([...Array.from(datesA), ...Array.from(datesB)]);
        const totalDays = unionDates.size;

        if (totalDays > 0) {
          habitPairs.push({
            habitA: habitMap.get(habitIds[i]) || '—',
            habitB: habitMap.get(habitIds[j]) || '—',
            coCompleted,
            totalDays,
            correlation: coCompleted / totalDays,
          });
        }
      }
    }

    habitPairs.sort((a, b) => b.correlation - a.correlation);

    // Weekly trend (last 8 weeks)
    const weeklyTrend: number[] = [];
    const today = new Date();

    for (let week = 7; week >= 0; week--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (week * 7 + today.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      let weekCompleted = 0;
      let weekTotal = 0;

      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = completedByDate.get(dateStr)?.size || 0;
        weekCompleted += dayLogs;
        weekTotal += habits.length;
      }

      weeklyTrend.push(weekTotal > 0 ? weekCompleted / weekTotal : 0);
    }

    // Most consistent habit
    let mostConsistentHabit = { habitId: '', habitTitle: '—', rate: 0 };
    const habitsNeedingAttention: { habitId: string; habitTitle: string; rate: number }[] = [];

    for (const habit of habits) {
      const dates = habitCompletedDates.get(habit.id) || new Set();
      const habitLogs = logs.filter((l) => l.habitId === habit.id);
      const habitDates = new Set(habitLogs.map((l) => l.date));
      const rate = habitDates.size > 0 ? dates.size / habitDates.size : 0;

      if (rate > mostConsistentHabit.rate) {
        mostConsistentHabit = { habitId: habit.id, habitTitle: habit.title, rate };
      }

      if (rate < 0.5 && habitDates.size >= 3) {
        habitsNeedingAttention.push({ habitId: habit.id, habitTitle: habit.title, rate });
      }
    }

    habitsNeedingAttention.sort((a, b) => a.rate - b.rate);

    const totalCompletions = logs.filter((l) => l.status === 'completed').length;
    const totalPossible = habits.length * totalDays;

    return {
      longestStreak,
      bestDay,
      habitPairs: habitPairs.slice(0, 5),
      weeklyTrend,
      totalDays,
      completionRate: totalPossible > 0 ? totalCompletions / totalPossible : 0,
      mostConsistentHabit,
      habitsNeedingAttention: habitsNeedingAttention.slice(0, 3),
    };
  }, [habits, logs]);
}
