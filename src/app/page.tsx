'use client';

import { useState, useEffect } from 'react';
import { HomeView } from '@/components/dashboard/HomeView';
import { StatsView } from '@/components/analytics/StatsView';
import { SettingsView } from '@/components/common/SettingsView';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { AddHabitSheet } from '@/components/common/AddHabitSheet';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { HabitSuggestions } from '@/components/dashboard/HabitSuggestions';
import { HabitDetailSheet } from '@/components/dashboard/SwipeableHabitCard';
import { useHabitStore } from '@/store/useHabitStore';
import { useHabitsForDate } from '@/hooks/useHabits';
import { Habit, HabitWithStreak } from '@/types';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedDetailHabit, setSelectedDetailHabit] = useState<HabitWithStreak | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const selectedDate = useHabitStore((s) => s.selectedDate);
  const habitsWithStreak = useHabitsForDate(selectedDate);

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
    window.addEventListener('open-add-habit', handleOpenAddHabit);
    window.addEventListener('delete-habit', handleDeleteHabit);
    return () => {
      window.removeEventListener('open-add-habit', handleOpenAddHabit);
      window.removeEventListener('delete-habit', handleDeleteHabit);
    };
  }, []);

  const setSelectedDate = useHabitStore((s) => s.setSelectedDate);

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, [setSelectedDate]);

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
