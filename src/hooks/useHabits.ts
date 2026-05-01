'use client';

import { useMemo } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import { calculateStreak, getTodayStatus } from '@/lib/streak';
import { HabitWithStreak } from '@/types';

export function useHabitsForDate(date: string): HabitWithStreak[] {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);

  return useMemo(() => {
    return habits.map((habit) => ({
      ...habit,
      streak: calculateStreak(logs, habit.id),
      todayStatus: getTodayStatus(logs, habit.id, date),
    }));
  }, [habits, logs, date]);
}

export function useTodayCompletion(date: string) {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);

  return useMemo(() => {
    if (habits.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completed = habits.filter((h) =>
      logs.some((l) => l.habitId === h.id && l.date === date && l.status === 'completed')
    ).length;

    return {
      completed,
      total: habits.length,
      percentage: Math.round((completed / habits.length) * 100),
    };
  }, [habits, logs, date]);
}

export function useWeeklyMomentum() {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);

  return useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekDates = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.add(d.toISOString().split('T')[0]);
    }

    const totalPossible = habits.length * 7;
    if (totalPossible === 0) return 0;

    const completed = logs.filter(
      (l) =>
        l.status === 'completed' &&
        habits.some((h) => h.id === l.habitId) &&
        weekDates.has(l.date)
    ).length;

    return Math.round((completed / totalPossible) * 100);
  }, [habits, logs]);
}
