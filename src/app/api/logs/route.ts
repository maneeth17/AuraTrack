import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { logs, habits } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

async function getUserHabitIds(userId: string): Promise<string[]> {
  if (!db) return [];
  const userHabits = await db.select({ id: habits.id }).from(habits).where(eq(habits.userId, userId));
  return userHabits.map((h) => h.id);
}

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userHabitIds = await getUserHabitIds(session.user.id);
    if (userHabitIds.length === 0) {
      return NextResponse.json({ logs: [] });
    }

    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habitId');

    let allLogs;
    if (habitId) {
      allLogs = await db.select().from(logs).where(eq(logs.habitId, habitId));
    } else {
      allLogs = await db.select().from(logs).where(inArray(logs.habitId, userHabitIds));
    }

    return NextResponse.json({ logs: allLogs });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { habitId, date, status } = body;

    const habit = await db.select({ id: habits.id }).from(habits).where(and(eq(habits.id, habitId), eq(habits.userId, session.user.id))).limit(1);
    if (!habit.length) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const existing = await db.select().from(logs).where(and(eq(logs.habitId, habitId), eq(logs.date, date)));

    if (existing.length > 0) {
      if (existing[0].status === status) {
        await db.delete(logs).where(and(eq(logs.habitId, habitId), eq(logs.date, date)));
        return NextResponse.json({ success: true, action: 'removed' });
      } else {
        const updated = await db.update(logs)
          .set({ status })
          .where(and(eq(logs.habitId, habitId), eq(logs.date, date)))
          .returning();
        return NextResponse.json({ log: updated[0], action: 'updated' });
      }
    }

    const newLog = await db.insert(logs).values({
      id: `${habitId}-${date}`,
      habitId,
      date,
      status,
    }).returning();

    return NextResponse.json({ log: newLog[0], action: 'created' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habitId');
    const date = searchParams.get('date');

    if (!habitId || !date) {
      return NextResponse.json({ error: 'Missing habitId or date' }, { status: 400 });
    }

    await db.delete(logs).where(and(eq(logs.habitId, habitId), eq(logs.date, date)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
  }
}
