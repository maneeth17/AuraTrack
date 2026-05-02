'use client';

import { useMemo, memo } from 'react';
import { useHabitStore } from '@/store/useHabitStore';

const INTENSITY_COLORS = [
  'bg-white/[0.03]',
  'bg-accent/20',
  'bg-accent/40',
  'bg-accent/60',
  'bg-accent',
];

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const HeatmapCell = memo(function HeatmapCell({ intensity, date }: { intensity: number; date: string }) {
  return (
    <div
      className={`w-[11px] h-[11px] rounded-sm ${INTENSITY_COLORS[intensity]}`}
      title={`${date}: ${intensity > 0 ? `${Math.round((intensity / 4) * 100)}%` : 'No activity'}`}
    />
  );
});

export const ActivityHeatmap = memo(function ActivityHeatmap() {
  const logs = useHabitStore((s) => s.logs);
  const habitCount = useHabitStore((s) => s.habits.length);

  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxPossible = Math.max(habitCount, 1);

    const completionMap = new Map<string, number>();
    for (let i = 0; i < logs.length; i++) {
      const l = logs[i];
      if (l.status === 'completed') {
        completionMap.set(l.date, (completionMap.get(l.date) || 0) + 1);
      }
    }

    const weeks: { date: string; intensity: number }[][] = [];
    let currentWeek: { date: string; intensity: number }[] = [];

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      const dayOfWeek = d.getDay();
      const count = completionMap.get(dateStr) || 0;
      const intensity = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxPossible) * 4));

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({ date: dateStr, intensity });
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [logs, habitCount]);

  return (
    <div className="overflow-x-auto hide-scrollbar" style={{ contentVisibility: 'auto' }}>
      <div className="flex gap-[3px] min-w-fit pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <HeatmapCell key={`${wi}-${di}`} intensity={day.intensity} date={day.date} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 text-[0.6rem] text-white/30">
        <span>Less</span>
        <div className="flex gap-[3px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-[11px] h-[11px] rounded-sm ${INTENSITY_COLORS[i]}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
});
