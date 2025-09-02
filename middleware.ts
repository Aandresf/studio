import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas que no requieren autenticación
const PUBLIC_PATHS = [
  '/login',
  '/api',
  '/_next',
  '/_static',
  '/favicon.ico',
  '/robots.txt'
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) return NextResponse.next();

  // Check for session cookie
  const cookie = req.headers.get('cookie') || '';
  const hasSession = cookie.split(';').map(s => s.trim()).some(s => s.startsWith('session='));

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|_static|favicon.ico).*)'],
};
