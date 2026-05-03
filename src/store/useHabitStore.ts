import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { HabitStore, Habit, Log, LogStatus } from '@/types';
import { generateId } from '@/lib/streak';
import * as api from '@/lib/api';
import { getLevelFromXP } from '@/types';

function getTodayDate(): string {
  if (typeof window === 'undefined') return '2024-01-01';
  return new Date().toISOString().split('T')[0];
}

const SYNC_KEY = 'auratrack-last-sync';

function getStorageKey(): string {
  if (typeof window === 'undefined') return 'auratrack-storage-guest';
  const userId = localStorage.getItem('auratrack-user-id') || 'guest';
  return `auratrack-storage-${userId}`;
}

const customStorage = createJSONStorage(() => ({
  getItem: () => {
    const key = getStorageKey();
    return localStorage.getItem(key);
  },
  setItem: (_name: string, value: string) => {
    const key = getStorageKey();
    localStorage.setItem(key, value);
  },
  removeItem: () => {
    const key = getStorageKey();
    localStorage.removeItem(key);
  },
}));

const syncFromServer = async () => {
  try {
    const [habits, logs] = await Promise.all([
      api.fetchHabits(),
      api.fetchLogs(),
    ]);
    useHabitStore.setState({ habits, logs });
  } catch (error) {
    console.error('Failed to sync from server:', error);
  }
};

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      selectedDate: getTodayDate(),
      xp: 0,
      level: 1,

      syncFromServer,

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
      },

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

      setHabitTargetCount: (id: string, targetCount: number) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, targetCount } : h
          ),
        }));

        try {
          api.updateHabit(id, { targetCount } as Partial<Habit>);
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
          api.deleteHabit(id);
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
          api.upsertLog(habitId, date, status);
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
              ...state.logs,
              { habitId, date, status: 'completed' as const },
            ],
          };
        });

        try {
          const existing = get().logs.find(
            (l) => l.habitId === habitId && l.date === date
          );
          if (existing && existing.status === 'completed') {
            api.deleteLog(habitId, date);
          } else {
            api.upsertLog(habitId, date, 'completed');
          }
        } catch {
          // Queue for retry when online
        }
      },

      incrementHabitCount: (habitId: string, date: string) => {
        set((state) => {
          const existingIndex = state.logs.findIndex(
            (l) => l.habitId === habitId && l.date === date
          );

          if (existingIndex >= 0) {
            const existingLog = state.logs[existingIndex];
            const newCount = (existingLog.count || 0) + 1;
            return {
              logs: state.logs.map((l, i) =>
                i === existingIndex ? { ...l, count: newCount, status: 'completed' as const } : l
              ),
            };
          }

          return {
            logs: [
              ...state.logs,
              { habitId, date, status: 'completed' as const, count: 1 },
            ],
          };
        });

        try {
          api.upsertLog(habitId, date, 'completed');
        } catch {
          // Queue for retry when online
        }
      },

      decrementHabitCount: (habitId: string, date: string) => {
        set((state) => {
          const existingIndex = state.logs.findIndex(
            (l) => l.habitId === habitId && l.date === date
          );

          if (existingIndex >= 0) {
            const existingLog = state.logs[existingIndex];
            const newCount = (existingLog.count || 0) - 1;

            if (newCount <= 0) {
              return {
                logs: state.logs.filter((l) => !(l.habitId === habitId && l.date === date)),
              };
            }

            return {
              logs: state.logs.map((l, i) =>
                i === existingIndex ? { ...l, count: newCount } : l
              ),
            };
          }

          return state;
        });

        try {
          const existing = get().logs.find((l) => l.habitId === habitId && l.date === date);
          if (existing) {
            const newCount = (existing.count || 0) - 1;
            if (newCount <= 0) {
              api.deleteLog(habitId, date);
            } else {
              api.upsertLog(habitId, date, 'completed', newCount);
            }
          }
        } catch {
          // Queue for retry when online
        }
      },

      addXP: (amount: number) => {
        set((state) => {
          const newXP = state.xp + amount;
          const newLevel = getLevelFromXP(newXP);
          return {
            xp: newXP,
            level: newLevel,
          };
        });
      },

      checkLevelUp: () => {
        const state = get();
        const level = getLevelFromXP(state.xp);
        if (level > state.level) {
          set({ level });
          return true;
        }
        return false;
      },

      importData: (data: { habits: Habit[]; logs: Log[] }) => {
        set({ habits: data.habits, logs: data.logs });
      },

      exportData: () => {
        const state = get();
        return {
          habits: state.habits,
          logs: state.logs,
        };
      },

      resetAll: async () => {
        set({ habits: [], logs: [], xp: 0, level: 1 });

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
      storage: customStorage,
      partialize: (state) => ({
        habits: state.habits,
        logs: state.logs,
        selectedDate: state.selectedDate,
        xp: state.xp,
        level: state.level,
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
