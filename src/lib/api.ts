import { Habit, Log } from '@/types';

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchHabits(): Promise<Habit[]> {
  const data = await apiFetch('/api/habits');
  return data.habits.map((h: { [key: string]: unknown }) => ({
    id: h.id as string,
    title: h.title as string,
    description: (h.description as string) || '',
    category: h.category as string,
    frequency: h.frequency as 'daily' | 'weekly',
    days: h.days as string[],
    color: h.color as string,
    icon: h.icon as string,
    createdAt: h.created_at ? new Date(h.created_at as string).toISOString() : new Date().toISOString(),
  }));
}

export async function fetchLogs(habitId?: string): Promise<Log[]> {
  const params = habitId ? `?habitId=${habitId}` : '';
  const data = await apiFetch(`/api/logs${params}`);
  return data.logs;
}

export async function createHabit(habit: Habit): Promise<Habit> {
  const data = await apiFetch('/api/habits', {
    method: 'POST',
    body: JSON.stringify(habit),
  });
  return {
    ...data.habit,
    createdAt: data.habit.created_at?.toISOString() || new Date().toISOString(),
  };
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
  const data = await apiFetch('/api/habits', {
    method: 'PUT',
    body: JSON.stringify({ id, ...updates }),
  });
  return {
    ...data.habit,
    createdAt: data.habit.created_at?.toISOString() || new Date().toISOString(),
  };
}

export async function deleteHabit(id: string): Promise<void> {
  await apiFetch(`/api/habits?id=${id}`, { method: 'DELETE' });
}

export async function upsertLog(habitId: string, date: string, status: string): Promise<Log> {
  const data = await apiFetch('/api/logs', {
    method: 'POST',
    body: JSON.stringify({ habitId, date, status }),
  });
  return data.log;
}

export async function deleteLog(habitId: string, date: string): Promise<void> {
  await apiFetch(`/api/logs?habitId=${habitId}&date=${date}`, { method: 'DELETE' });
}
