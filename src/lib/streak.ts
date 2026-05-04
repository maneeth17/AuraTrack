import { Log, StreakData } from '@/types';

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToUTCString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysBetween(dateA: Date, dateB: Date): number {
  const utcA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const utcB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

export function calculateStreak(logs: Log[], habitId: string, targetCount: number = 1): StreakData {
  const completedDates = logs
    .filter((l) => l.habitId === habitId && l.status === 'completed' && (targetCount <= 1 || l.count === undefined || l.count >= targetCount))
    .map((l) => l.date)
    .filter((date, idx, arr) => arr.indexOf(date) === idx)
    .sort((a, b) => b.localeCompare(a));

  if (completedDates.length === 0) {
    return { current: 0, longest: 0, consistencyScore: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecentDate = parseDateStr(completedDates[0]);
  const daysSinceLast = daysBetween(mostRecentDate, today);

  let current = 0;

  if (daysSinceLast <= 1) {
    current = 1;
    for (let i = 1; i < completedDates.length; i++) {
      const prevDate = parseDateStr(completedDates[i - 1]);
      const currDate = parseDateStr(completedDates[i]);
      const gap = daysBetween(currDate, prevDate);
      if (gap === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  let longest = current;
  let tempLongest = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const prevDate = parseDateStr(completedDates[i - 1]);
    const currDate = parseDateStr(completedDates[i]);
    const gap = daysBetween(currDate, prevDate);

    if (gap === 1) {
      tempLongest++;
      longest = Math.max(longest, tempLongest);
    } else {
      tempLongest = 1;
    }
  }

  const last30Days = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last30Days.add(dateToUTCString(d));
  }

  const completedIn30 = completedDates.filter((d) => last30Days.has(d)).length;

  return {
    current,
    longest,
    consistencyScore: Math.round((completedIn30 / 30) * 100),
  };
}

export function getConsistencyScoreWeighted(logs: Log[], habitId: string, targetCount: number = 1): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedDates = new Set(
    logs
      .filter((l) => l.habitId === habitId && l.status === 'completed' && (targetCount <= 1 || l.count === undefined || l.count >= targetCount))
      .map((l) => l.date)
  );

  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = dateToUTCString(d);
    const weight = 1 - i * 0.02;
    totalWeight += weight;
    if (completedDates.has(dateStr)) {
      weightedSum += weight;
    }
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
}

export function getTodayStatus(logs: Log[], habitId: string, date: string, targetCount: number = 1): 'completed' | 'skipped' | null {
  const log = logs.find((l) => l.habitId === habitId && l.date === date);
  if (!log) return null;
  if (log.status !== 'completed') return log.status;
  if (targetCount > 1 && log.count !== undefined && log.count < targetCount) return null;
  return log.status;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const CATEGORIES = [
  { name: 'Health', color: '#34d399', icon: 'heart' },
  { name: 'Productivity', color: '#818cf8', icon: 'zap' },
  { name: 'Mindfulness', color: '#a78bfa', icon: 'brain' },
  { name: 'Fitness', color: '#fb923c', icon: 'dumbbell' },
  { name: 'Learning', color: '#38bdf8', icon: 'book' },
  { name: 'Social', color: '#f472b6', icon: 'users' },
];

export const HABIT_ICONS = [
  'heart', 'zap', 'brain', 'dumbbell', 'book', 'users',
  'sun', 'moon', 'droplets', 'coffee', 'target', 'trophy',
  'music', 'camera', 'smile', 'star', 'shield', 'flame',
];

export const HABIT_COLORS = [
  '#818cf8', '#34d399', '#f472b6', '#fb923c', '#38bdf8',
  '#a78bfa', '#fbbf24', '#f87171', '#2dd4bf', '#e879f9',
];
