import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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
      const { xp, level, themePreference } = body;

      const updateData: Partial<typeof users.$inferInsert> = {};
      if (xp !== undefined) updateData.xp = xp;
      if (level !== undefined) updateData.level = level;
      if (themePreference !== undefined) updateData.themePreference = themePreference;

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, session.user.id));

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error('PUT /api/user error:', error);
      const message = error instanceof Error ? error.message : 'Failed to update user';
      return NextResponse.json({ error: message }, { status: 500 });
    }
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

      const user = await db.select({ 
        xp: users.xp, 
        level: users.level,
        themePreference: users.themePreference 
      })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      if (!user.length) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        xp: user[0].xp || 0, 
        level: user[0].level || 1,
        themePreference: user[0].themePreference || 'auto'
      });
    } catch (error: unknown) {
      console.error('GET /api/user error:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch user';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
