import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

/**
 * Impersonation endpoint for super admins to access the system as another user
 * This is useful for support and debugging purposes
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get the user to impersonate
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        avatarUrl: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent impersonating other super admins
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json({ 
        error: "Cannot impersonate other super admin users" 
      }, { status: 403 });
    }

    // Log the impersonation
    await prisma.activityLog.create({
      data: {
        action: "user_impersonation_started",
        entityType: "USER",
        entityId: userId,
        details: JSON.stringify({
          superAdmin: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name
          },
          targetUser: {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
            role: targetUser.role
          },
          timestamp: new Date().toISOString()
        }),
        userId: session.user.id
      }
    });

    // Return the impersonation token data
    // The client should handle creating a new session with this user data
    return NextResponse.json({
      success: true,
      impersonationData: {
        originalAdmin: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        },
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role,
          organizationId: targetUser.organizationId,
          avatarUrl: targetUser.avatarUrl
        },
        impersonationStarted: new Date().toISOString()
      },
      message: "Impersonation session created. Redirect to dashboard."
    });
  } catch {
    console.error("Error in user impersonation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * End impersonation and return to super admin session
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { originalAdminId, impersonatedUserId } = body;

    // Verify the session user ID matches the originalAdminId
    if (session.user.id !== originalAdminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Log the end of impersonation
    await prisma.activityLog.create({
      data: {
        action: "user_impersonation_ended",
        entityType: "USER",
        entityId: impersonatedUserId,
        details: JSON.stringify({
          originalAdminId,
          impersonatedUserId,
          endedAt: new Date().toISOString()
        }),
        userId: originalAdminId
      }
    });

    return NextResponse.json({
      success: true,
      message: "Impersonation ended"
    });
  } catch {
    console.error("Error ending impersonation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
