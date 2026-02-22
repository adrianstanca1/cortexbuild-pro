import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Helper to check tenant admin access (COMPANY_OWNER or ADMIN within their org)
const hasTenantAdminAccess = (role: string | undefined) => {
  return role === "SUPER_ADMIN" || role === "COMPANY_OWNER" || role === "ADMIN";
};

// Helper to check superadmin access (platform-wide)
const isSuperAdmin = (role: string | undefined) => {
  return role === "SUPER_ADMIN";
};

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // SUPER_ADMIN has full access to everything including /admin
    if (isSuperAdmin(token?.role as string)) {
      return NextResponse.next();
    }
    
    // /admin routes are SUPER_ADMIN only - redirect others
    if (path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // COMPANY_OWNER and ADMIN have full access to their tenant routes
    if (hasTenantAdminAccess(token?.role as string)) {
      return NextResponse.next();
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow public paths including invitation acceptance
        if (
          path === "/" || 
          path === "/login" || 
          path === "/signup" ||
          path.startsWith("/invitation/accept") ||
          path.startsWith("/team-invite/accept") ||
          path.startsWith("/site-checkin")
        ) {
          return true;
        }
        // Require auth for all other paths
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/team/:path*",
    "/documents/:path*",
    "/admin/:path*",
    "/company/:path*",
    "/settings/:path*",
    "/rfis/:path*",
    "/daily-reports/:path*",
    "/safety/:path*",
    "/submittals/:path*",
    "/change-orders/:path*",
    "/reports/:path*",
    "/punch-lists/:path*",
    "/inspections/:path*",
    "/equipment/:path*",
    "/meetings/:path*",
    "/invitation/:path*",
    "/team-invite/:path*",
    "/certifications/:path*",
    "/executive/:path*",
    "/work-packages/:path*",
    "/cost-codes/:path*",
    "/forecasting/:path*",
    "/risk-register/:path*",
    "/budget/:path*",
    "/milestones/:path*",
    "/materials/:path*",
    "/subcontractors/:path*",
    "/drawings/:path*",
    "/permits/:path*",
    "/site-diary/:path*",
    "/defects/:path*",
    "/progress-claims/:path*",
    "/time-tracking/:path*"
  ]
};
