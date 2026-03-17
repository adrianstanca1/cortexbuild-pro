import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const testMode = process.env.TEST_MODE === 'true';

    // Allow public paths
    const publicPaths = ['/login', '/signup', '/team-invite/accept', '/api/auth'];
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // In test mode, bypass authentication
    if (testMode) {
      return NextResponse.next();
    }

    // If user is not authenticated, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Onboarding redirect logic
    const organizationId = token.organizationId as string | null;

    // If user has no organization, redirect to onboarding
    if (!organizationId && !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // If onboarding is not complete, redirect to onboarding (except for API routes and onboarding itself)
    if (organizationId && token.onboardingStatus === 'IN_PROGRESS' && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow unauthenticated access to public paths
        // This is handled by the function above
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. .svg, .png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
