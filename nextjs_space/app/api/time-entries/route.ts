import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const where: any = {
      project: { organizationId: session.user.organizationId }
    };

    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } }
      },
      orderBy: { date: "desc" }
    });

    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, taskId, date, hours, description, billable, hourlyRate } = body;

    if (!projectId || !date || !hours) {
      return NextResponse.json({ error: "Project, date, and hours are required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: session.user.organizationId ?? "" }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId,
        taskId: taskId || null,
        userId: session.user.id,
        date: new Date(date),
        hours: parseFloat(hours),
        description,
        billable: billable ?? true,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        status: "PENDING"
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "time_entry_created",
        entityType: "TimeEntry",
        entityId: timeEntry.id,
        entityName: `${hours}h on ${project.name}`,
        details: `Logged ${hours} hours`,
        userId: session.user.id,
        projectId
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "time_entry_created",
      data: { timeEntry, projectId }
    });

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 });
  }
}
