'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import nextDynamic from 'next/dynamic';
import { HomeView } from '@/components/dashboard/HomeView';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { AddHabitSheet } from '@/components/common/AddHabitSheet';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { HabitSuggestions } from '@/components/dashboard/HabitSuggestions';
import { HabitDetailSheet } from '@/components/dashboard/SwipeableHabitCard';
import { PomodoroTimer } from '@/components/focus/PomodoroTimer';
import { useHabitStore } from '@/store/useHabitStore';
import { useHabitsForDate } from '@/hooks/useHabits';
import { Habit, HabitWithStreak } from '@/types';

const StatsView = nextDynamic(() => import('@/components/analytics/StatsView').then((m) => ({ default: m.StatsView })), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 pb-8 lg:pb-4">
      <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>
  ),
});

const SettingsView = nextDynamic(() => import('@/components/common/SettingsView').then((m) => ({ default: m.SettingsView })), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 pb-8 lg:pb-4">
      <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>
  ),
});

const LabView = nextDynamic(() => import('@/components/analytics/LabView').then((m) => ({ default: m.LabView })), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 pb-8 lg:pb-4">
      <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>
  ),
});

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedDetailHabit, setSelectedDetailHabit] = useState<HabitWithStreak | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pomodoroProps, setPomodoroProps] = useState<{
    habitId: string;
    habitTitle: string;
    habitColor: string;
    onComplete: () => void;
    onClose: () => void;
  } | null>(null);

  const selectedDate = useHabitStore((s) => s.selectedDate);
  const setSelectedDate = useHabitStore((s) => s.setSelectedDate);
  const habitsWithStreak = useHabitsForDate(selectedDate);

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, [setSelectedDate]);

  useEffect(() => {
    const handleOpenAddHabit = () => {
      setEditingHabit(null);
      setIsAddSheetOpen(true);
    };
    const handleDeleteHabit = (e: Event) => {
      const habitId = (e as CustomEvent).detail as string;
      if (window.confirm('Are you sure you want to delete this habit? All tracking data will be lost.')) {
        useHabitStore.getState().deleteHabit(habitId);
      }
    };
    const handleShowPomodoro = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        habitId: string;
        habitTitle: string;
        habitColor: string;
        onComplete: () => void;
        onClose: () => void;
      };
      setPomodoroProps(detail);
    };
    window.addEventListener('open-add-habit', handleOpenAddHabit);
    window.addEventListener('delete-habit', handleDeleteHabit);
    window.addEventListener('show-pomodoro', handleShowPomodoro);
    return () => {
      window.removeEventListener('open-add-habit', handleOpenAddHabit);
      window.removeEventListener('delete-habit', handleDeleteHabit);
      window.removeEventListener('show-pomodoro', handleShowPomodoro);
    };
  }, []);

  const handleFabPress = () => {
    setEditingHabit(null);
    setIsAddSheetOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsAddSheetOpen(true);
  };

  const handleOpenDetail = (habit: HabitWithStreak) => {
    setSelectedDetailHabit(habit);
    setIsDetailOpen(true);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView onOpenSuggestions={() => setIsSuggestionsOpen(true)} onOpenDetail={handleOpenDetail} />;
      case 'stats':
        return <StatsView />;
      case 'lab':
        return <LabView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView onOpenSuggestions={() => setIsSuggestionsOpen(true)} onOpenDetail={handleOpenDetail} />;
    }
  };

  const resolvedDetailHabit = selectedDetailHabit
    ? habitsWithStreak.find((h) => h.id === selectedDetailHabit.id) || selectedDetailHabit
    : null;

  return (
    <>
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddHabit={handleFabPress}
      />

      <div className="lg:pl-72">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8 pb-24 lg:pb-8">
          {renderView()}
        </div>
      </div>

      <div className="lg:hidden">
        <BottomNavBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onFabPress={handleFabPress}
        />
      </div>

      <HabitSuggestions
        isOpen={isSuggestionsOpen}
        onClose={() => setIsSuggestionsOpen(false)}
      />

      <AddHabitSheet
        isOpen={isAddSheetOpen}
        onClose={() => {
          setIsAddSheetOpen(false);
          setEditingHabit(null);
        }}
        editHabit={editingHabit}
      />

      <HabitDetailSheet
        habit={resolvedDetailHabit}
        date={selectedDate}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDetailHabit(null);
        }}
        onEdit={handleEditHabit}
      />

      {pomodoroProps && (
        <PomodoroTimer
          habitId={pomodoroProps.habitId}
          habitTitle={pomodoroProps.habitTitle}
          habitColor={pomodoroProps.habitColor}
          onComplete={pomodoroProps.onComplete}
          onClose={() => {
            pomodoroProps.onClose();
            setPomodoroProps(null);
          }}
        />
      )}
    </>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <main className="min-h-screen bg-background">
      <DashboardContent />
    </main>
  );
}
