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
  createdAt: string;
}

export interface Log {
  date: string;
  habitId: string;
  status: LogStatus;
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
  syncFromServer: () => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void | Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => void | Promise<void>;
  deleteHabit: (id: string) => void | Promise<void>;
  markHabit: (habitId: string, date: string, status: LogStatus) => void | Promise<void>;
  toggleHabit: (habitId: string, date: string) => void | Promise<void>;
  setSelectedDate: (date: string) => void;
  importData: (data: { habits: Habit[]; logs: Log[] }) => void;
  exportData: () => { habits: Habit[]; logs: Log[] };
  resetAll: () => void | Promise<void>;
}
