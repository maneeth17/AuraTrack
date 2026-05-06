import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { habits } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !db) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allHabits = await db.select().from(habits).where(eq(habits.userId, session.user.id)).orderBy(habits.createdAt);
  return NextResponse.json({ habits: allHabits });
}

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const newHabit = await db.insert(habits).values({
    id: body.id,
    userId: session.user.id,
    title: body.title,
    description: body.description || '',
    category: body.category,
    frequency: body.frequency,
    days: body.days,
    color: body.color,
    icon: body.icon,
    isFocusHabit: body.isFocusHabit === true || body.isFocusHabit === 'true' ? 'true' : 'false',
    targetCount: body.targetCount || 1,
    currentCount: 0,
  }).returning();

  return NextResponse.json({ habit: newHabit[0] }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, title, description, category, frequency, days, color, icon, isFocusHabit, targetCount } = body;

  const existing = await db.select().from(habits).where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));
  if (!existing.length) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
  }

  const updateData: Partial<typeof habits.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (frequency !== undefined) updateData.frequency = frequency;
  if (days !== undefined) updateData.days = days;
  if (color !== undefined) updateData.color = color;
  if (icon !== undefined) updateData.icon = icon;
  if (isFocusHabit !== undefined) updateData.isFocusHabit = isFocusHabit === true || isFocusHabit === 'true' ? 'true' : 'false';
  if (targetCount !== undefined) updateData.targetCount = targetCount;

  const updated = await db.update(habits)
    .set(updateData)
    .where(eq(habits.id, id))
    .returning();

  return NextResponse.json({ habit: updated[0] });
}

export async function DELETE(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing habit id' }, { status: 400 });
  }

  await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
