import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");
    const since = searchParams.get("since");

    const where: any = {};
    if (since) {
      where.createdAt = { gt: new Date(since) };
    }

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true,
            organization: { select: { id: true, name: true } }
          } 
        },
        project: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    // Get quick stats
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [recentCount, activeUsers] = await Promise.all([
      prisma.activityLog.count({ where: { createdAt: { gte: fiveMinutesAgo } } }),
      prisma.activityLog.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: fiveMinutesAgo } }
      })
    ]);

    return NextResponse.json({
      activities: activities.map(a => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        details: a.details,
        createdAt: a.createdAt,
        user: a.user ? { id: a.user.id, name: a.user.name, email: a.user.email, role: a.user.role } : null,
        project: a.project,
        organization: a.user?.organization || null
      })),
      stats: {
        recentActivities: recentCount,
        activeUsers: activeUsers.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching live feed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
