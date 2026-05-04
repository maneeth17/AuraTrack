import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { logs, habits } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getUserHabitIds(userId: string): Promise<string[]> {
  if (!db) return [];
  const userHabits = await db.select({ id: habits.id }).from(habits).where(eq(habits.userId, userId));
  return userHabits.map((h) => h.id);
}

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userHabitIds = await getUserHabitIds(session.user.id);
    
    const logsData = userHabitIds.length > 0
      ? await db.query.logs.findMany({
          where: (logs, { inArray }) => inArray(logs.habitId, userHabitIds),
        })
      : [];
    
    return NextResponse.json({ logs: logsData });
  } catch (error) {
    console.error('GET /api/logs error:', error);
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
    
    // Verify the habit belongs to the user
    const habit = await db
      .select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.id, body.habitId), eq(habits.userId, session.user.id)))
      .limit(1);
    
    if (!habit.length) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Upsert log using database-level ON CONFLICT
    const upsertedLog = await db.insert(logs).values({
      id: crypto.randomUUID(),
      habitId: body.habitId,
      date: body.date,
      status: body.status || 'completed',
      count: body.count !== undefined ? body.count : 0,
    }).onConflictDoUpdate({
      target: [logs.habitId, logs.date],
      set: {
        status: body.status || 'completed',
        count: body.count !== undefined ? body.count : sql`${logs.count}`,
      }
    }).returning();

    return NextResponse.json({ log: upsertedLog[0] }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/logs error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create log';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { habitId, date, ...updates } = body;

    if (!habitId || !date) {
      return NextResponse.json({ error: 'Missing habitId or date' }, { status: 400 });
    }

    // Verify the habit belongs to the user
    const habit = await db
      .select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, session.user.id)))
      .limit(1);

    if (!habit.length) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const existing = await db
      .select()
      .from(logs)
      .where(and(eq(logs.habitId, habitId), eq(logs.date, date)))
      .limit(1);

    if (existing.length >0) {
      const updated = await db
        .update(logs)
        .set(updates)
        .where(and(eq(logs.habitId, habitId), eq(logs.date, date)))
        .returning();
      return NextResponse.json({ log: updated[0] });
    } else {
      const newLog = await db.insert(logs).values({
        id: crypto.randomUUID(),
        habitId,
        date,
        status: updates.status || 'completed',
        count: updates.count || 0,
      }).returning();
      return NextResponse.json({ log: newLog[0] }, { status: 201 });
    }
  } catch (error: unknown) {
    console.error('PUT /api/logs error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update log';
    return NextResponse.json({ error: message }, { status: 500 });
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

    // Verify the habit belongs to the user
    const habit = await db
      .select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, session.user.id)))
      .limit(1);

    if (!habit.length) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    await db
      .delete(logs)
      .where(and(eq(logs.habitId, habitId), eq(logs.date, date)));
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/logs error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete log';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
