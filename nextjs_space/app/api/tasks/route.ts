export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    // Add limit to prevent fetching thousands of tasks
    const tasks = await prisma.task.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 1000 // Limit to 1000 most recent tasks
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id || '';
    const organizationId = (session.user as { organizationId?: string })?.organizationId;
    const body = await request.json();
    const { title, description, projectId, assigneeId, priority, status, dueDate } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: userId || null,
        priority: priority || "MEDIUM",
        status: status || "TODO",
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "created task",
        entityType: "Task",
        entityId: task.id,
        entityName: task.title,
        userId,
        projectId
      }
    });

    // Broadcast real-time event to organization
    if (organizationId) {
      broadcastToOrganization(organizationId, {
        type: 'task_created',
        timestamp: new Date().toISOString(),
        payload: {
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            projectId: task.projectId,
            projectName: task.project?.name,
            assigneeId: task.assigneeId,
            assigneeName: task.assignee?.name
          },
          userId
        }
      });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
