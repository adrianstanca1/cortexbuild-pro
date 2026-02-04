export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize pagination parameters
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(parsedLimit, 1), 100);
    const skip = (page - 1) * limit;

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const where = orgId ? { project: { organizationId: orgId } } : {};

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.task.count({ where })
    ]);

    return NextResponse.json({ 
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
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
