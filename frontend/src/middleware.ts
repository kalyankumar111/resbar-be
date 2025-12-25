import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // We'll use a cookie to track auth status for middleware since it can't access Zustand directly
    // For now, let's look at the path to decide where to go
    const { pathname } = request.nextUrl;

    // Example of how we might check a cookie
    const isAuthenticated = request.cookies.get('gastrohub_auth_status')?.value === 'true';
    const userRole = request.cookies.get('gastrohub_user_role')?.value;

    // Protect dashboard routes
    const isDashboardRoute = pathname.startsWith('/admin') ||
        pathname.startsWith('/chef') ||
        pathname.startsWith('/waiter') ||
        pathname === '/';

    if (isDashboardRoute && !isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Prevent logged in users from visiting login page
    if (pathname === '/login' && isAuthenticated) {
        const redirectPath = userRole === 'superadmin' ? '/admin' : `/${userRole}`;
        return NextResponse.redirect(new URL(redirectPath || '/', request.url));
    }

    // Basic role-based protection
    if (pathname.startsWith('/admin') && userRole !== 'admin' && userRole !== 'superadmin') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/chef') && userRole !== 'chef' && userRole !== 'superadmin') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/waiter') && userRole !== 'waiter' && userRole !== 'superadmin') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
