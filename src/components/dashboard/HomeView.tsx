'use client';

import { useCallback } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import { useHabitIds, useTodayCompletion } from '@/hooks/useHabits';
import { RibbonDatePicker } from './RibbonDatePicker';
import { HabitBentoGrid } from './HabitBentoGrid';
import { CircularProgressRing } from '@/components/analytics/CircularProgressRing';
import { Calendar, Zap, ArrowRight } from 'lucide-react';
import { LevelBar } from '@/components/common/LevelBar';
import { HabitWithStreak } from '@/types';

interface HomeViewProps {
  onOpenSuggestions: () => void;
  onOpenDetail: (habit: HabitWithStreak) => void;
}

export function HomeView({ onOpenSuggestions, onOpenDetail }: HomeViewProps) {
  const selectedDate = useHabitStore((s) => s.selectedDate);
  const habitIds = useHabitIds();
  const completion = useTodayCompletion(selectedDate);

  const selectedDateObj = new Date(selectedDate);
  const formattedDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleCardClick = useCallback(() => {
    if (habitIds.length === 0) {
      onOpenSuggestions();
    } else {
      onOpenSuggestions();
    }
  }, [habitIds.length, onOpenSuggestions]);

  return (
    <div className="space-y-6 pb-8 lg:pb-4 main-scroll-container">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-foreground/40 mt-1">{formattedDate}</p>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent" />
          </div>
        </div>
      </div>

      <RibbonDatePicker />

      <LevelBar />

      <button
        onClick={handleCardClick}
        className="bento-card flex items-center gap-5 w-full text-left cursor-pointer group"
      >
        <CircularProgressRing
          percentage={completion.percentage}
          size={90}
          strokeWidth={7}
          color={completion.percentage === 100 ? '#34d399' : '#818cf8'}
        />
        <div className="flex-1">
          <p className="text-base font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
            {completion.percentage === 100
              ? 'All done today!'
              : completion.percentage >= 50
              ? "Looking great — keep going!"
              : "Let's get started!"}
          </p>
          <p className="text-sm text-foreground/40 mt-1">
            <span className="text-foreground/70 font-medium">{completion.completed}</span> of {completion.total} habits completed
          </p>
        </div>
        <div className="hidden lg:block text-xs text-foreground/20 group-hover:text-accent group-hover:translate-x-1 transition-all">
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>

      <div id="habits-list" className="flex items-center gap-2 px-1">
        <Calendar className="w-4 h-4 text-foreground/30" />
        <span className="text-xs font-medium text-foreground/30 uppercase tracking-wider">Today&apos;s Habits</span>
      </div>

      <HabitBentoGrid date={selectedDate} onOpenDetail={onOpenDetail} />
    </div>
  );
}
