import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { HabitStore, Habit, Log, LogStatus } from '@/types';
import { generateId } from '@/lib/streak';
import * as api from '@/lib/api';

function getTodayDate(): string {
  if (typeof window === 'undefined') return '2024-01-01';
  return new Date().toISOString().split('T')[0];
}

const SYNC_KEY = 'auratrack-last-sync';

async function syncFromServer() {
  try {
    const [habits, logs] = await Promise.all([
      api.fetchHabits(),
      api.fetchLogs(),
    ]);

    const { habits: localHabits, importData } = useHabitStore.getState();

    if (habits.length > 0 || localHabits.length === 0) {
      importData({ habits, logs });
      if (typeof window !== 'undefined') {
        localStorage.setItem(SYNC_KEY, new Date().toISOString());
      }
    }
  } catch {
    // Offline: use cached localStorage data
  }
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      selectedDate: getTodayDate(),

      syncFromServer,

      addHabit: async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
        const newHabit: Habit = {
          ...habit,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ habits: [...state.habits, newHabit] }));

        try {
          await api.createHabit(newHabit);
        } catch {
          // Queue for retry when online
        }
      },

      updateHabit: async (id: string, updates: Partial<Habit>) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }));

        try {
          await api.updateHabit(id, updates);
        } catch {
          // Queue for retry when online
        }
      },

      deleteHabit: async (id: string) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          logs: state.logs.filter((l) => l.habitId !== id),
        }));

        try {
          await api.deleteHabit(id);
        } catch {
          // Queue for retry when online
        }
      },

      markHabit: async (habitId: string, date: string, status: LogStatus) => {
        set((state) => {
          const existingIndex = state.logs.findIndex(
            (l) => l.habitId === habitId && l.date === date
          );

          let newLogs: Log[];

          if (existingIndex >= 0) {
            const existingLog = state.logs[existingIndex];
            if (existingLog.status === status) {
              newLogs = [
                ...state.logs.slice(0, existingIndex),
                ...state.logs.slice(existingIndex + 1),
              ];
            } else {
              newLogs = state.logs.map((l, i) =>
                i === existingIndex ? { ...l, status } : l
              );
            }
          } else {
            newLogs = [...state.logs, { habitId, date, status }];
          }

          return { logs: newLogs };
        });

        try {
          await api.upsertLog(habitId, date, status);
        } catch {
          // Queue for retry when online
        }
      },

      toggleHabit: async (habitId: string, date: string) => {
        set((state) => {
          const existingIndex = state.logs.findIndex(
            (l) => l.habitId === habitId && l.date === date
          );

          if (existingIndex >= 0 && state.logs[existingIndex].status === 'completed') {
            return {
              logs: [
                ...state.logs.slice(0, existingIndex),
                ...state.logs.slice(existingIndex + 1),
              ],
            };
          }

          return {
            logs: [
              ...state.logs.filter((l) => !(l.habitId === habitId && l.date === date)),
              { habitId, date, status: 'completed' as const },
            ],
          };
        });

        try {
          const existing = get().logs.find((l) => l.habitId === habitId && l.date === date);
          if (existing && existing.status === 'completed') {
            await api.deleteLog(habitId, date);
          } else {
            await api.upsertLog(habitId, date, 'completed');
          }
        } catch {
          // Queue for retry when online
        }
      },

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
      },

      importData: (data: { habits: Habit[]; logs: Log[] }) => {
        set({ habits: data.habits, logs: data.logs });
      },

      exportData: () => {
        const { habits, logs } = get();
        return { habits, logs };
      },

      resetAll: async () => {
        set({ habits: [], logs: [] });

        try {
          const { habits } = get();
          await Promise.all(habits.map((h) => api.deleteHabit(h.id)));
        } catch {
          // Queue for retry when online
        }
      },
    }),
    {
      name: 'auratrack-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        habits: state.habits,
        logs: state.logs,
        selectedDate: getTodayDate(),
      }),
      onRehydrateStorage: () => {
        return () => {
          const lastSync = localStorage.getItem(SYNC_KEY);
          const shouldSync = !lastSync || Date.now() - new Date(lastSync).getTime() > 60000;

          if (shouldSync) {
            syncFromServer();
          }
        };
      },
    }
  )
);
