import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

// POST - Bulk approve/reject time entries
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const userRole = session.user.role;
    if (
      !["ADMIN", "PROJECT_MANAGER", "COMPANY_OWNER", "SUPER_ADMIN"].includes(
        userRole ?? "",
      )
    ) {
      return NextResponse.json(
        { error: "Not authorized to approve time entries" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { entryIds, action, rejectionReason } = body; // action: 'approve' or 'reject'

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json(
        { error: "No entries specified" },
        { status: 400 },
      );
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Verify all entries belong to user's organization and get full data
    const entries = await prisma.timeEntry.findMany({
      where: {
        id: { in: entryIds },
        project: { organizationId: session.user.organizationId ?? "" },
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    if (entries.length !== entryIds.length) {
      return NextResponse.json(
        { error: "Some entries not found or not authorized" },
        { status: 404 },
      );
    }

    // Update all entries
    const status = action === "approve" ? "APPROVED" : "REJECTED";

    await prisma.timeEntry.updateMany({
      where: { id: { in: entryIds } },
      data: {
        status,
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    // Update in-memory entries with new status for return value
    const updatedEntries = entries.map((entry) => ({
      ...entry,
      status,
      approvedById: session.user.id,
      approvedAt: new Date(),
      approvedBy: { id: session.user.id, name: session.user.name || "" },
    }));

    // Log activity for each entry
    const activityLogs = entries.map((entry) => ({
      action:
        action === "approve" ? "time_entry_approved" : "time_entry_rejected",
      entityType: "TimeEntry",
      entityId: entry.id,
      entityName: `${entry.hours}h - ${entry.project.name}`,
      details:
        action === "reject"
          ? `Rejected: ${rejectionReason || "No reason provided"}`
          : `Approved ${entry.hours} hours`,
      userId: session.user.id,
      projectId: entry.projectId,
    }));

    await prisma.activityLog.createMany({ data: activityLogs });

    // Broadcast update
    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "time_entries_bulk_updated",
      data: {
        entryIds,
        action,
        status,
        approvedBy: { id: session.user.id, name: session.user.name },
      },
    });

    return NextResponse.json({
      success: true,
      updated: entries.length,
      entries: updatedEntries,
    });
  } catch (error) {
    console.error("Error bulk approving time entries:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

// GET - Get time entries pending approval
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");

    const where: any = {
      status: "PENDING",
      project: { organizationId: session.user.organizationId },
    };

    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;

    const pendingEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    // Group by user for easier review
    const groupedByUser: Record<string, any[]> = {};
    pendingEntries.forEach((entry) => {
      const userId = entry.user.id;
      if (!groupedByUser[userId]) {
        groupedByUser[userId] = [];
      }
      groupedByUser[userId].push(entry);
    });

    const summary = {
      totalPending: pendingEntries.length,
      totalHours: pendingEntries.reduce((sum, e) => sum + e.hours, 0),
      byUser: Object.entries(groupedByUser).map(([_userId, entries]) => ({
        user: entries[0].user,
        count: entries.length,
        totalHours: entries.reduce((sum, e) => sum + e.hours, 0),
      })),
    };

    return NextResponse.json({
      entries: pendingEntries,
      summary,
      grouped: groupedByUser,
    });
  } catch (error) {
    console.error("Error fetching pending time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending entries" },
      { status: 500 },
    );
  }
}
