'use client';

import { useMemo, memo, useCallback } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import { hapticVibrate } from '@/lib/haptics';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DateButton = memo(function DateButton({
  date,
  dayName,
  dayNum,
  isSelected,
  isToday,
  onSelect,
}: {
  date: string;
  dayName: string;
  dayNum: number;
  isSelected: boolean;
  isToday: boolean;
  onSelect: (date: string) => void;
}) {
  const handleClick = useCallback(() => {
    onSelect(date);
    hapticVibrate([5], 'date-select');
  }, [date, onSelect]);

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center justify-center min-w-[3.25rem] h-16 rounded-2xl transition-all duration-200 ${
        isSelected
          ? 'bg-accent/20 border border-accent/40 shadow-glow scale-105'
          : isToday
          ? 'bg-white/5 border border-white/10'
          : 'bg-transparent border border-transparent hover:bg-white/5'
      }`}
    >
      <span className={`text-[0.65rem] font-medium ${isSelected ? 'text-accent' : 'text-foreground/40'}`}>
        {dayName}
      </span>
      <span className={`text-lg font-bold mt-0.5 ${isSelected ? 'text-foreground' : 'text-foreground/70'}`}>
        {dayNum}
      </span>
      {!isSelected && isToday && (
        <span className="w-1 h-1 rounded-full bg-accent mt-0.5" />
      )}
    </button>
  );
});

export const RibbonDatePicker = memo(function RibbonDatePicker() {
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

  const handleSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  return (
    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-2 px-1">
      {dates.map((item) => (
        <DateButton
          key={item.date}
          date={item.date}
          dayName={item.dayName}
          dayNum={item.dayNum}
          isSelected={item.date === selectedDate}
          isToday={item.isToday}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
});
