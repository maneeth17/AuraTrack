import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { habits } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const allHabits = await db.select().from(habits).orderBy(habits.createdAt);
    return NextResponse.json({ habits: allHabits });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const body = await request.json();
    const newHabit = await db.insert(habits).values({
      id: body.id,
      title: body.title,
      description: body.description || '',
      category: body.category,
      frequency: body.frequency,
      days: body.days,
      color: body.color,
      icon: body.icon,
    }).returning();

    return NextResponse.json({ habit: newHabit[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const body = await request.json();
    const { id, ...updates } = body;

    const updated = await db.update(habits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(habits.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    return NextResponse.json({ habit: updated[0] });
  } catch {
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing habit id' }, { status: 400 });
    }

    await db.delete(habits).where(eq(habits.id, id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}
