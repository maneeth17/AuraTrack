import { Habit, Log } from '@/types';

const API_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || `API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchHabits(): Promise<Habit[]> {
  const data = await apiFetch('/api/habits');
  return (data.habits || []).map((h: Record<string, unknown>) => ({
    id: h.id,
    title: h.title,
    description: h.description || '',
    category: h.category,
    frequency: h.frequency,
    days: h.days || [],
    color: h.color,
    icon: h.icon,
    isFocusHabit: h.is_focus_habit === 'true' || h.isFocusHabit === true,
    targetCount: h.target_count || h.targetCount || 1,
    currentCount: 0,
    createdAt: h.created_at ? new Date(h.created_at as string).toISOString() : new Date().toISOString(),
  }));
}

export async function fetchLogs(habitId?: string): Promise<Log[]> {
  const params = habitId ? `?habitId=${habitId}` : '';
  const data = await apiFetch(`/api/logs${params}`);
  return (data.logs || []).map((log: Record<string, unknown>) => ({
    date: log.date,
    habitId: log.habit_id || log.habitId,
    status: log.status,
    count: log.count || 0,
  }));
}

export async function fetchUser(): Promise<{ xp: number; level: number }> {
  const data = await apiFetch('/api/user');
  return { xp: data.xp || 0, level: data.level || 1 };
}

export async function createHabit(habit: Habit): Promise<Habit> {
  const data = await apiFetch('/api/habits', {
    method: 'POST',
    body: JSON.stringify({
      ...habit,
      isFocusHabit: habit.isFocusHabit || false,
    }),
  });
  return {
    ...data.habit,
    createdAt: data.habit?.created_at ? new Date(data.habit.created_at as string).toISOString() : new Date().toISOString(),
  };
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
  const data = await apiFetch('/api/habits', {
    method: 'PUT',
    body: JSON.stringify({ id, ...updates }),
  });
  return data.habit;
}

export async function deleteHabit(id: string): Promise<void> {
  await apiFetch(`/api/habits?id=${id}`, { method: 'DELETE' });
}

export async function upsertLog(habitId: string, date: string, status: string, count?: number): Promise<Log> {
  const data = await apiFetch('/api/logs', {
    method: 'POST',
    body: JSON.stringify({ habitId, date, status, count }),
  });
  return data.log;
}

export async function deleteLog(habitId: string, date: string): Promise<void> {
  await apiFetch(`/api/logs?habitId=${habitId}&date=${date}`, { method: 'DELETE' });
}

export async function updateUserXP(xp: number, level: number): Promise<void> {
  await apiFetch('/api/user', {
    method: 'PUT',
    body: JSON.stringify({ xp, level }),
  }).catch(() => {});
}
