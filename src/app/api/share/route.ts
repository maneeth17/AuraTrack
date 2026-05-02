import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, habits } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !db) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const shareId = nanoid(10);

  await db
    .update(users)
    .set({ shareId })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ shareId });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get('id');

  if (!shareId || !db) {
    return NextResponse.json({ error: 'Share ID required' }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.shareId, shareId),
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userHabits = await db.query.habits.findMany({
    where: eq(habits.userId, user.id),
    orderBy: (habits, { desc }) => [desc(habits.createdAt)],
  });

  const habitIds = userHabits.map((h) => h.id);
  const userLogs = habitIds.length > 0
    ? await db.query.logs.findMany({
        where: (logs, { inArray }) => inArray(logs.habitId, habitIds),
      })
    : [];

  const habitsWithLogs = userHabits.map((habit) => {
    const habitLogs = userLogs.filter((log) => log.habitId === habit.id);
    const completedDays = habitLogs.filter((log) => log.status === 'completed').length;
    const totalDays = habitLogs.length;
    const currentStreak = calculateStreak(habitLogs);

    return {
      id: habit.id,
      title: habit.title,
      description: habit.description,
      category: habit.category,
      color: habit.color,
      icon: habit.icon,
      completedDays,
      totalDays,
      currentStreak,
      createdAt: habit.createdAt.toISOString().split('T')[0],
    };
  });

  return NextResponse.json({
    name: user.name || user.email,
    image: user.image,
    habits: habitsWithLogs,
    totalHabits: userHabits.length,
    totalCompletions: userLogs.filter((log) => log.status === 'completed').length,
  });
}

function calculateStreak(habitLogs: { date: string; status: string }[]): number {
  const completedDates = habitLogs
    .filter((log) => log.status === 'completed')
    .map((log) => log.date)
    .sort((a, b) => b.localeCompare(a));

  if (completedDates.length === 0) return 0;

  let streak = 1;
  let currentDate = new Date(completedDates[0]);

  for (let i = 1; i < completedDates.length; i++) {
    const prevDate = new Date(completedDates[i]);
    const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else if (diffDays > 1) {
      break;
    }
  }

  return streak;
}
