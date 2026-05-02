import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function middleware() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|login|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-*.js|share|$).*)'],
};
