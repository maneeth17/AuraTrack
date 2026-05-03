export type Frequency = 'daily' | 'weekly';

export type LogStatus = 'completed' | 'skipped';

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: string;
  frequency: Frequency;
  days: string[];
  color: string;
  icon: string;
  isFocusHabit?: boolean;
  targetCount?: number;
  currentCount?: number;
  createdAt: string;
}

export interface Log {
  date: string;
  habitId: string;
  status: LogStatus;
  count?: number;
}

export interface StreakData {
  current: number;
  longest: number;
  consistencyScore: number;
}

export interface HabitWithStreak extends Habit {
  streak: StreakData;
  todayStatus: LogStatus | null;
}

export interface HabitStore {
  habits: Habit[];
  logs: Log[];
  selectedDate: string;
  isSyncing: boolean;
  syncFromServer: (retryCount?: number) => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void | Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => void | Promise<void>;
  deleteHabit: (id: string) => void | Promise<void>;
  markHabit: (habitId: string, date: string, status: LogStatus) => void | Promise<void>;
  toggleHabit: (habitId: string, date: string) => void | Promise<void>;
  incrementHabitCount: (habitId: string, date: string) => void | Promise<void>;
  decrementHabitCount: (habitId: string, date: string) => void | Promise<void>;
  setHabitTargetCount: (habitId: string, targetCount: number) => void | Promise<void>;
  setSelectedDate: (date: string) => void;
  setPomodoroSettings: (settings: Partial<{ focusDuration: number; shortBreak: number; longBreak: number; enabled: boolean }>) => void;
  importData: (data: { habits: Habit[]; logs: Log[] }) => void;
  exportData: () => { habits: Habit[]; logs: Log[] };
  resetAll: () => void | Promise<void>;
  xp: number;
  level: number;
  addXP: (amount: number) => void;
  checkLevelUp: () => boolean;
  pomodoroSettings: {
    focusDuration: number;
    shortBreak: number;
    longBreak: number;
    enabled: boolean;
  };
}

export function getXPForLevel(level: number): number {
  return level * 100;
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  let totalXP = 0;
  while (totalXP + getXPForLevel(level) <= xp) {
    totalXP += getXPForLevel(level);
    level++;
  }
  return level;
}
