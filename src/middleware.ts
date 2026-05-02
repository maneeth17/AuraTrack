export const config = {
  matcher: ['/((?!api|login|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-*.js|share|$).*)'],
};

export function middleware() {
  return;
}
