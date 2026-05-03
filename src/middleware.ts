import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox|login).*)'],
};

export function middleware() {
  return NextResponse.next();
}
