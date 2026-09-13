import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isProtectedRoute = pathname.startsWith('/dashboard');

  // Check for session cookie from better-auth or neon-auth
  const sessionCookie = request.cookies.get('better-auth.session_token') || 
                        request.cookies.get('__Secure-better-auth.session_token') ||
                        request.cookies.get('neon-auth.session_token') ||
                        request.cookies.get('__Secure-neon-auth.session_token');

  // Redirect to login if unauthenticated user tries to access protected route
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    // Optional: add ?callbackUrl to redirect back after login
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if authenticated user tries to access auth pages
  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
