'use client';

import { useMemo } from 'react';
import { useHabitStore } from '@/store/useHabitStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function RibbonDatePicker() {
  const selectedDate = useHabitStore((s) => s.selectedDate);
  const setSelectedDate = useHabitStore((s) => s.setSelectedDate);

  const dates = useMemo(() => {
    const today = new Date();
    const result: { date: string; dayName: string; dayNum: number; month: string; isToday: boolean }[] = [];
    for (let i = -3; i <= 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      result.push({
        date: d.toISOString().split('T')[0],
        dayName: DAYS[d.getDay()],
        dayNum: d.getDate(),
        month: MONTHS[d.getMonth()],
        isToday: i === 0,
      });
    }
    return result;
  }, []);

  return (
    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-2 px-1">
      {dates.map((item) => {
        const isSelected = item.date === selectedDate;
        return (
          <button
            key={item.date}
            onClick={() => setSelectedDate(item.date)}
            className={`flex flex-col items-center justify-center min-w-[3.25rem] h-16 rounded-2xl transition-all duration-200 ${
              isSelected
                ? 'bg-accent/20 border border-accent/40 shadow-glow scale-105'
                : item.isToday
                ? 'bg-white/5 border border-white/10'
                : 'bg-transparent border border-transparent hover:bg-white/5'
            }`}
          >
            <span className={`text-[0.65rem] font-medium ${isSelected ? 'text-accent' : 'text-white/40'}`}>
              {item.dayName}
            </span>
            <span className={`text-lg font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-white/70'}`}>
              {item.dayNum}
            </span>
            {!isSelected && item.isToday && (
              <span className="w-1 h-1 rounded-full bg-accent mt-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
