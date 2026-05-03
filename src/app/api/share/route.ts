import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { db } from '@/db';
import { users, habits } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !db) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shareId = nanoid(10);

    await db
      .update(users)
      .set({ shareId })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ shareId });
  } catch (error) {
    console.error('Share API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
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

    // Fetch user's habits with their logs
    const userHabits = await db.query.habits.findMany({
      where: eq(habits.userId, user.id),
    });

    // Fetch all logs for user's habits
    const habitIds = userHabits.map(h => h.id);
    const allLogs = habitIds.length > 0
      ? await db.query.logs.findMany({
          where: (logs, { inArray }) => inArray(logs.habitId, habitIds),
        })
      : [];

    // Calculate stats for each habit
    const habitsWithStats = userHabits.map(habit => {
      const habitLogs = allLogs.filter(l => l.habitId === habit.id);
      const completedLogs = habitLogs.filter(l => l.status === 'completed' || (l.count && l.count > 0));
      
      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      const checkDate = new Date(today);
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasLog = habitLogs.some(l => l.date === dateStr && (l.status === 'completed' || (l.count && l.count > 0)));
        if (hasLog) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate consistency score
      const totalDays = Math.max(1, Math.ceil((Date.now() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
      const consistencyScore = Math.round((completedLogs.length / totalDays) * 100);

      return {
        id: habit.id,
        title: habit.title,
        description: habit.description,
        category: habit.category,
        color: habit.color,
        icon: habit.icon,
        completedDays: completedLogs.length,
        totalDays: totalDays,
        currentStreak,
        consistencyScore: Math.min(100, consistencyScore),
        createdAt: habit.createdAt.toISOString(),
      };
    });

    // Calculate overall stats
    const totalCompletions = allLogs.filter(l => l.status === 'completed' || (l.count && l.count > 0)).length;
    const overallConsistency = habitsWithStats.length > 0
      ? Math.round(habitsWithStats.reduce((acc, h) => acc + h.consistencyScore, 0) / habitsWithStats.length)
      : 0;

    return NextResponse.json({
      name: user.name || user.email,
      image: user.image,
      shareId: user.shareId,
      habits: habitsWithStats,
      totalHabits: userHabits.length,
      totalCompletions: totalCompletions,
      consistencyScore: overallConsistency,
    });
  } catch (error) {
    console.error('Share API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
