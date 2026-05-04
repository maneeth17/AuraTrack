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

function loadPomodoroSettings() {
  if (typeof window === 'undefined') {
    return { focusDuration: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60, enabled: false };
  }
  try {
    const saved = localStorage.getItem('auratrack-pomodoro-settings');
    return saved ? JSON.parse(saved) : {
      focusDuration: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60, enabled: false,
    };
  } catch {
    return { focusDuration: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60, enabled: false };
  }
}

export function savePomodoroSettings(settings: { focusDuration: number; shortBreak: number; longBreak: number; enabled: boolean }) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auratrack-pomodoro-settings', JSON.stringify(settings));
  }
}

// Sync from server - call this AFTER login
export async function syncFromServer(): Promise<void> {
  console.log('[syncFromServer] Starting sync...');
  try {
    const [habits, logs, userData] = await Promise.all([
      api.fetchHabits(),
      api.fetchLogs(),
      api.fetchUser(),
    ]);
    console.log('[syncFromServer] Got:', habits.length, 'habits,', logs.length, 'logs, XP:', userData.xp);
    
    // Import store dynamically to avoid circular reference
    const { useHabitStore } = await import('@/store/useHabitStore');
    useHabitStore.setState({
      habits,
      logs,
      xp: userData.xp || 0,
      level: userData.level || 1,
    });
    
    localStorage.setItem(SYNC_KEY, new Date().toISOString());
    console.log('[syncFromServer] Sync complete');
  } catch (error: unknown) {
    console.error('[syncFromServer] Error:', error);
  }
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      selectedDate: getTodayDate(),
      xp: 0,
      level: 1,
      isSyncing: false,
      pomodoroSettings: loadPomodoroSettings(),

      // This is called from login page after successful auth
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
        } catch (e) {
          console.error('addHabit API error:', e);
        }
      },

      updateHabit: async (id: string, updates: Partial<Habit>) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }));
        try {
          await api.updateHabit(id, updates);
        } catch (e) {
          console.error('updateHabit API error:', e);
        }
      },

      deleteHabit: async (id: string) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          logs: state.logs.filter((l) => l.habitId !== id),
        }));
        try {
          await api.deleteHabit(id);
        } catch (e) {
          console.error('deleteHabit API error:', e);
        }
      },

      markHabit: async (habitId: string, date: string, status: LogStatus) => {
        const state = get();
        const existingIndex = state.logs.findIndex(
          (l) => l.habitId === habitId && l.date === date
        );

        let xpChange = 0;

        if (existingIndex >= 0) {
          const existingLog = state.logs[existingIndex];
          if (existingLog.status === status) {
            // Remove log
            set((state) => ({
              logs: [
                ...state.logs.slice(0, existingIndex),
                ...state.logs.slice(existingIndex + 1),
              ],
            }));
            if (existingLog.status === 'completed') xpChange = -10;
          } else {
            set((state) => ({
              logs: state.logs.map((l, i) =>
                i === existingIndex ? { ...l, status } : l
              ),
            }));
            if (status === 'completed' && existingLog.status !== 'completed') xpChange = 10;
            if (existingLog.status === 'completed' && status !== 'completed') xpChange = -10;
          }
        } else {
          set((state) => ({
            logs: [...state.logs, { habitId, date, status }],
          }));
          if (status === 'completed') xpChange = 10;
        }

        if (xpChange !== 0) {
          set((state) => {
            const newXP = Math.max(0, state.xp + xpChange);
            return { xp: newXP, level: getLevelFromXP(newXP) };
          });
        }

        try {
          await api.upsertLog(habitId, date, status);
          api.updateUserXP(get().xp, get().level).catch(() => {});
        } catch (e) {
          console.error('markHabit API error:', e);
        }
      },

      toggleHabit: async (habitId: string, date: string) => {
        const state = get();
        const existingIndex = state.logs.findIndex(
          (l) => l.habitId === habitId && l.date === date
        );

        const isUnchecking = existingIndex >= 0 && state.logs[existingIndex].status === 'completed';
        let xpChange = 0;

        if (isUnchecking) {
          // Unchecking
          set((state) => ({
            logs: [
              ...state.logs.slice(0, existingIndex),
              ...state.logs.slice(existingIndex + 1),
            ],
          }));
          xpChange = -10;
        } else {
          // Checking
          set((state) => ({
            logs: [
              ...state.logs,
              { habitId, date, status: 'completed' as const },
            ],
          }));
          xpChange = 10;
        }

        set((state) => {
          const newXP = Math.max(0, state.xp + xpChange);
          return { xp: newXP, level: getLevelFromXP(newXP) };
        });

        try {
          if (isUnchecking) {
            await api.deleteLog(habitId, date);
          } else {
            await api.upsertLog(habitId, date, 'completed');
          }
          api.updateUserXP(get().xp, get().level).catch(() => {});
        } catch (e) {
          console.error('toggleHabit API error:', e);
        }
      },

      incrementHabitCount: (habitId: string, date: string) => {
        const state = get();
        const existingIndex = state.logs.findIndex(
          (l) => l.habitId === habitId && l.date === date
        );

        const habit = state.habits.find(h => h.id === habitId);
        const targetCount = Number(habit?.targetCount || 1);
        let newCountForApi = 1;

        if (existingIndex >= 0) {
          const existingLog = state.logs[existingIndex];
          const newCount = (existingLog.count || 0) + 1;
          newCountForApi = newCount;
          set((state) => ({
            logs: state.logs.map((l, i) =>
              i === existingIndex ? { ...l, count: newCount, status: 'completed' as const } : l
            ),
          }));
          if (targetCount > 1 && newCount >= targetCount && (existingLog.count || 0) < targetCount) {
            set((state) => {
              const newXP = state.xp + 10;
              return { xp: newXP, level: getLevelFromXP(newXP) };
            });
          }
        } else {
          set((state) => ({
            logs: [
              ...state.logs,
              { habitId, date, status: 'completed' as const, count: 1 },
            ],
          }));
          if (targetCount > 1 && 1 >= targetCount) {
            set((state) => {
              const newXP = state.xp + 10;
              return { xp: newXP, level: getLevelFromXP(newXP) };
            });
          }
        }

        try {
          api.upsertLog(habitId, date, 'completed', newCountForApi).then(() => {
            api.updateUserXP(get().xp, get().level).catch(() => {});
          }).catch(() => {});
        } catch (e) {
          console.error('incrementHabitCount API error:', e);
        }
      },

      decrementHabitCount: (habitId: string, date: string) => {
        const state = get();
        const existingIndex = state.logs.findIndex(
          (l) => l.habitId === habitId && l.date === date
        );

        if (existingIndex >= 0) {
          const existingLog = state.logs[existingIndex];
          const currentCount = existingLog.count ?? 0;
          const newCount = currentCount - 1;
          const habit = state.habits.find(h => h.id === habitId);
          const targetCount = Number(habit?.targetCount || 1);

          let xpChange = 0;
          if (targetCount > 1 && currentCount >= targetCount && newCount < targetCount) {
            xpChange = -10;
          }

          if (newCount <= 0) {
            set((state) => {
              const updates: Partial<HabitStore> = {
                logs: state.logs.filter((l) => !(l.habitId === habitId && l.date === date)),
              };
              if (existingLog.status === 'completed') xpChange -= 10;
              if (xpChange !== 0) {
                updates.xp = Math.max(0, state.xp + xpChange);
                updates.level = getLevelFromXP(updates.xp);
              }
              return updates;
            });
          } else {
            set((state) => {
              const updates: Partial<HabitStore> = {
                logs: state.logs.map((l, i) =>
                  i === existingIndex ? { ...l, count: newCount } : l
                ),
              };
              if (xpChange !== 0) {
                updates.xp = Math.max(0, state.xp + xpChange);
                updates.level = getLevelFromXP(updates.xp);
              }
              return updates;
            });
          }

          try {
            if (newCount <= 0) {
              api.deleteLog(habitId, date).then(() => {
                api.updateUserXP(get().xp, get().level).catch(() => {});
              }).catch(() => {});
            } else {
              api.upsertLog(habitId, date, 'completed', newCount).then(() => {
                api.updateUserXP(get().xp, get().level).catch(() => {});
              }).catch(() => {});
            }
          } catch (e) {
            console.error('decrementHabitCount API error:', e);
          }
        }
      },

      addXP: (amount: number) => {
        set((state) => {
          const newXP = state.xp + amount;
          return { xp: newXP, level: getLevelFromXP(newXP) };
        });

        try {
          api.updateUserXP(get().xp, get().level).catch(() => {});
        } catch {}
      },

      setHabitTargetCount: async (habitId: string, targetCount: number) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === habitId ? { ...h, targetCount } : h)),
        }));
        try {
          await api.updateHabit(habitId, { targetCount });
        } catch {}
      },

      setPomodoroSettings: (settings) => {
        set((state) => {
          const newSettings = { ...state.pomodoroSettings, ...settings };
          savePomodoroSettings(newSettings);
          return { pomodoroSettings: newSettings };
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
        return { habits: state.habits, logs: state.logs };
      },

      resetAll: async () => {
        const previousHabits = get().habits;
        set({ habits: [], logs: [], xp: 0, level: 1 });
        try {
          await Promise.all(previousHabits.map((h) => api.deleteHabit(h.id)));
          api.updateUserXP(0, 1).catch(() => {});
        } catch (e) {
          console.error('resetAll API error:', e);
        }
      },
    }),
    {
      name: 'auratrack-storage',
      storage: customStorage,
      onRehydrateStorage: () => {
        return () => {
          // Don't sync here - causes circular reference issues
          // Sync is handled explicitly after login
        };
      },
    }
  )
);
