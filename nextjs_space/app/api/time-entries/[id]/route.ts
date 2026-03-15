import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: id,
        project: { organizationId: session.user.organizationId ?? "" },
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error("Error fetching time entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entry" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.timeEntry.findFirst({
      where: {
        id: id,
        project: { organizationId: session.user.organizationId ?? "" },
      },
      include: { project: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { hours, description, billable, hourlyRate, status } = body;

    const updateData: any = {};
    if (hours !== undefined) updateData.hours = parseFloat(hours);
    if (description !== undefined) updateData.description = description;
    if (billable !== undefined) updateData.billable = billable;
    if (hourlyRate !== undefined)
      updateData.hourlyRate = parseFloat(hourlyRate);

    // Handle approval workflow
    if (status && ["APPROVED", "REJECTED"].includes(status)) {
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
      updateData.status = status;
      updateData.approvedById = session.user.id;
      updateData.approvedAt = new Date();
    }

    const timeEntry = await prisma.timeEntry.update({
      where: { id: id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "time_entry_updated",
      data: { timeEntry },
    });

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.timeEntry.findFirst({
      where: {
        id: id,
        project: { organizationId: session.user.organizationId ?? "" },
      },
      include: { project: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 },
      );
    }

    // Only owner or admin can delete
    if (
      existing.userId !== session.user.id &&
      !["ADMIN", "PROJECT_MANAGER", "COMPANY_OWNER", "SUPER_ADMIN"].includes(
        session.user.role ?? "",
      )
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.timeEntry.delete({ where: { id: id } });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "time_entry_deleted",
      data: { id: id, projectId: existing.projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 },
    );
  }
}
