'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHabitStore } from '@/store/useHabitStore';

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function ActivityHeatmap() {
  const logs = useHabitStore(useShallow((s) => s.logs));
  const habitCount = useHabitStore((s) => s.habits.length);

  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: { date: string; count: number; maxCount: number }[] = [];

    const completionMap = new Map<string, number>();
    const completedLogs = logs.filter((l) => l.status === 'completed');
    completedLogs.forEach((log) => {
      completionMap.set(log.date, (completionMap.get(log.date) || 0) + 1);
    });

    const maxPossible = Math.max(habitCount, 1);

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      const count = completionMap.get(dateStr) || 0;
      days.push({ date: dateStr, count, maxCount: maxPossible });
    }

    return days;
  }, [logs, habitCount]);

  function getIntensity(count: number, maxCount: number): number {
    if (count === 0) return 0;
    return Math.min(4, Math.ceil((count / maxCount) * 4));
  }

  function getColor(intensity: number): string {
    const colors = [
      'bg-white/[0.03]',
      'bg-accent/20',
      'bg-accent/40',
      'bg-accent/60',
      'bg-accent',
    ];
    return colors[intensity];
  }

  const weeks: { date: string; intensity: number }[][] = [];
  let currentWeek: { date: string; intensity: number }[] = [];

  heatmapData.forEach((day) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({
      date: day.date,
      intensity: getIntensity(day.count, day.maxCount),
    });
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <div className="flex gap-[3px] min-w-fit pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={`${wi}-${di}`}
                className={`w-[11px] h-[11px] rounded-sm ${getColor(day.intensity)} transition-colors`}
                title={`${day.date}: ${day.intensity > 0 ? `${Math.round((day.intensity / 4) * 100)}%` : 'No activity'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 text-[0.6rem] text-white/30">
        <span>Less</span>
        <div className="flex gap-[3px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-[11px] h-[11px] rounded-sm ${getColor(i)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
