export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const orgId = user.organizationId;

    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");

    const where: any = {
      user: { organizationId: orgId },
    };

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = userId;
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Group by date for trend analysis
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyStats = await prisma.$queryRaw<
      { date: string; count: bigint }[]
    >`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "ActivityLog"
      WHERE "userId" IN (SELECT id FROM "User" WHERE "organizationId" = ${orgId})
      AND "createdAt" >= ${oneWeekAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return NextResponse.json({
      activities: activities.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      dailyStats: dailyStats.map((s) => ({
        date: s.date,
        count: Number(s.count),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching company activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
