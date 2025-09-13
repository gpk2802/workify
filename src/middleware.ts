import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Skip middleware during development when env vars might not be available
const isDevEnvironment = process.env.NODE_ENV === 'development';

// Define which routes are public and which require authentication
const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/confirmation'];
const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  // Skip middleware during development to avoid env variable errors
  if (isDevEnvironment) {
    return NextResponse.next();
  }
  
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    // Check if we have a session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const url = request.nextUrl.clone();
    const { pathname } = url;

    // If user is signed in and tries to access auth routes, redirect to dashboard
    if (session && authRoutes.some(route => pathname.startsWith(route))) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // If user is not signed in and tries to access protected routes, redirect to login
    if (!session && !publicRoutes.some(route => pathname === route || pathname.startsWith('/api/'))) {
      url.pathname = '/auth/login';
      url.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(url);
    }

    // Check admin access for admin routes
    if (session && adminRoutes.some(route => pathname.startsWith(route))) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!userData || userData.role !== 'admin') {
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.svg).*)'],
};