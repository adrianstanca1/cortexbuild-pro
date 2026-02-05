import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch comprehensive platform statistics
    const [users, organizations, projects, tasks, documents, rfis, submittals, changeOrders, safetyIncidents, dailyReports, activities] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.document.count(),
      prisma.rFI.count(),
      prisma.submittal.count(),
      prisma.changeOrder.count(),
      prisma.safetyIncident.count(),
      prisma.dailyReport.count(),
      prisma.activityLog.count()
    ]);

    // User role breakdown
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: { id: true }
    });

    // Project status breakdown
    const projectsByStatus = await prisma.project.groupBy({
      by: ["status"],
      _count: { id: true }
    });

    // Task status breakdown
    const tasksByStatus = await prisma.task.groupBy({
      by: ["status"],
      _count: { id: true }
    });

    // Recent user registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // Active users (logged in within 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await prisma.user.count({
      where: { lastLogin: { gte: sevenDaysAgo } }
    });

    // Organizations with user counts
    const orgStats = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            projects: true
          }
        }
      }
    });

    // Storage estimates (document count as proxy)
    const [dailyPhotos, safetyPhotos, rfiAttachments, submittalAttachments] = await Promise.all([
      prisma.dailyReportPhoto.count(),
      prisma.safetyIncidentPhoto.count(),
      prisma.rFIAttachment.count(),
      prisma.submittalAttachment.count()
    ]);

    const storageStats = {
      totalDocuments: Number(documents),
      totalPhotos: Number(dailyPhotos) + Number(safetyPhotos),
      totalAttachments: Number(rfiAttachments) + Number(submittalAttachments)
    };

    const response = {
      totals: {
        users: Number(users),
        organizations: Number(organizations),
        projects: Number(projects),
        tasks: Number(tasks),
        documents: Number(documents),
        rfis: Number(rfis),
        submittals: Number(submittals),
        changeOrders: Number(changeOrders),
        safetyIncidents: Number(safetyIncidents),
        dailyReports: Number(dailyReports),
        activities: Number(activities)
      },
      usersByRole: usersByRole.map(r => ({ role: r.role, count: Number(r._count.id) })),
      projectsByStatus: projectsByStatus.map(p => ({ status: p.status, count: Number(p._count.id) })),
      tasksByStatus: tasksByStatus.map(t => ({ status: t.status, count: Number(t._count.id) })),
      recentUsers: Number(recentUsers),
      activeUsers: Number(activeUsers),
      organizations: orgStats.map(o => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        userCount: Number(o._count.users),
        projectCount: Number(o._count.projects)
      })),
      storage: storageStats
    };

    return NextResponse.json(response);
  } catch {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
