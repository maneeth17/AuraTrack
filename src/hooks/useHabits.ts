'use client';

import { useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHabitStore } from '@/store/useHabitStore';
import { calculateStreak, getTodayStatus } from '@/lib/streak';
import { HabitWithStreak, Log } from '@/types';

function isLogComplete(log: Log): boolean {
  return log.status === 'completed' || Boolean(log.count && log.count > 0);
}

export function useHabitIds() {
  return useHabitStore(useShallow((s) => s.habits.map((habit) => habit.id)));
}

export function useHabitByIdSimple(id: string) {
  return useHabitStore(useShallow((s) => s.habits.find((h) => h.id === id)));
}

export function useHabitLogs(habitId: string) {
  return useHabitStore(
    useShallow((s) => s.logs.filter((log) => log.habitId === habitId))
  );
}

export function useHabitsForDate(date: string): HabitWithStreak[] {
  const habits = useHabitStore(useShallow((s) => s.habits));
  const logs = useHabitStore(useShallow((s) => s.logs));

  return useMemo(() => {
    return habits.map((habit) => ({
      ...habit,
      streak: calculateStreak(logs, habit.id),
      todayStatus: getTodayStatus(logs, habit.id, date),
    }));
  }, [habits, logs, date]);
}

export function useHabitById(id: string, date: string): HabitWithStreak | undefined {
  const habit = useHabitByIdSimple(id);
  const habitLogs = useHabitLogs(id);

  return useMemo(() => {
    if (!habit) return undefined;
    return {
      ...habit,
      streak: calculateStreak(habitLogs, habit.id),
      todayStatus: getTodayStatus(habitLogs, habit.id, date),
    };
  }, [habit, habitLogs, date]);
}

export function useTodayCompletion(date: string) {
  const habitIds = useHabitIds();
  const logsForDate = useHabitStore(
    useShallow((s) => s.logs.filter((log) => log.date === date))
  );

  return useMemo(() => {
    if (habitIds.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completedHabitIds = new Set(
      logsForDate.filter(isLogComplete).map((log) => log.habitId)
    );
    const completed = habitIds.filter((id) => completedHabitIds.has(id)).length;

    return {
      completed,
      total: habitIds.length,
      percentage: Math.round((completed / habitIds.length) * 100),
    };
  }, [habitIds, logsForDate]);
}

export function useWeeklyMomentum() {
  const habitIds = useHabitIds();
  const logs = useHabitStore(useShallow((s) => s.logs));

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

    const totalPossible = habitIds.length * 7;
    if (totalPossible === 0) return 0;

    const activeHabitIds = new Set(habitIds);
    const completed = logs.filter(
      (l) =>
        isLogComplete(l) &&
        activeHabitIds.has(l.habitId) &&
        weekDates.has(l.date)
    ).length;

    return Math.round((completed / totalPossible) * 100);
  }, [habitIds, logs]);
}

export function useHabitCount() {
  return useHabitStore((s) => s.habits.length);
}

export function useSelectedDate() {
  return useHabitStore((s) => s.selectedDate);
}

export function useXP() {
  return useHabitStore(useShallow((s) => ({ xp: s.xp, level: s.level })));
}

export function useHabitActions() {
  return useHabitStore(
    useShallow((s) => ({
      markHabit: s.markHabit,
      toggleHabit: s.toggleHabit,
      incrementHabitCount: s.incrementHabitCount,
      decrementHabitCount: s.decrementHabitCount,
      deleteHabit: s.deleteHabit,
      addXP: s.addXP,
    }))
  );
}
