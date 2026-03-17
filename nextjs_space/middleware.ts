import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback");

export async function middleware(req: NextRequest) {
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

  // Check for auth token cookie
  const authToken = req.cookies.get('auth-token')?.value;

  if (!authToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const verified = await jwtVerify(authToken, secret);
    const payload = verified.payload as any;

    // Onboarding redirect logic
    const organizationId = payload.organizationId as string | null;

    // If user has no organization, redirect to onboarding
    if (!organizationId && !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // If onboarding is not complete, redirect to onboarding
    if (organizationId && payload.onboardingStatus === 'IN_PROGRESS' && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.id as string);
    response.headers.set('x-user-role', payload.role as string);
    response.headers.set('x-organization-id', organizationId || '');
    return response;
  } catch (error) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

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
