import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Get site access logs for a project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const dateStr = searchParams.get("date");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID required" },
        { status: 400 },
      );
    }

    // Verify access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user?.organizationId || undefined,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse date or use today
    let startDate = new Date();
    if (dateStr) {
      startDate = new Date(dateStr);
    }
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    const logs = await prisma.siteAccessLog.findMany({
      where: {
        projectId,
        accessTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { accessTime: "desc" },
      take: 200,
    });

    // Calculate stats
    const entries = logs.filter((log) => log.accessType === "ENTRY").length;
    const exits = logs.filter((log) => log.accessType === "EXIT").length;

    return NextResponse.json({
      logs,
      stats: {
        entries,
        exits,
        onSite: Math.max(0, entries - exits),
      },
    });
  } catch (error) {
    console.error("Site access fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch site access data" },
      { status: 500 },
    );
  }
}
