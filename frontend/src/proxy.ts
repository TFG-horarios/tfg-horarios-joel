import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const publicRoutes = ['/', '/login', '/register'];
const protectedPrefixes = ['/organizations'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('auth-token')?.value;
  let isTokenValid = false;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp && decoded.exp * 1000 > Date.now()) {
        isTokenValid = true;
      }
    } catch {
      isTokenValid = false;
    }
  }

  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedRoute && !isTokenValid) {
    const loginUrl = new URL('/login', request.url);
    const redirectRes = NextResponse.redirect(loginUrl);
    if (token) redirectRes.cookies.delete('auth-token');
    return redirectRes;
  }

  if (isPublicRoute && isTokenValid) {
    return NextResponse.redirect(new URL('/organizations', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
