export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import {
  withAuthHandler,
  sanitizeEntityFields,
  broadcastEntityEvent,
  logActivity,
  errorResponse,
} from "@/lib/api-utils";

export const GET = withAuthHandler(async (request: NextRequest, context) => {
  if (!context.organizationId) {
    return errorResponse("FORBIDDEN", "User must belong to an organization");
  }

  // Add pagination support
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');
  const skip = (page - 1) * pageSize;

  // Get tasks with pagination
  const [tasks, totalCount] = await Promise.all([
    prisma.task.findMany({
      where: { project: { organizationId: context.organizationId } },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: skip
    }),
    prisma.task.count({
      where: { project: { organizationId: context.organizationId } }
    })
  ]);

  return NextResponse.json({ 
    tasks,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    }
  });
});

export const POST = withAuthHandler(async (request: NextRequest, context) => {
  const body = await request.json();
  const { title, description, projectId, assigneeId, priority, status, dueDate } = body;

  if (!title?.trim()) {
    return errorResponse("BAD_REQUEST", "Task title is required");
  }

  if (!projectId) {
    return errorResponse("BAD_REQUEST", "Project ID is required");
  }

  // Sanitize common fields
  const sanitized = sanitizeEntityFields({
    title,
    description,
  });

  const task = await prisma.task.create({
    data: {
      ...sanitized,
      projectId,
      assigneeId: assigneeId || null,
      creatorId: context.userId || null,
      priority: priority || "MEDIUM",
      status: status || "TODO",
      dueDate: dueDate ? new Date(dueDate) : null
    },
    include: {
      project: { select: { id: true, name: true, organizationId: true } },
      assignee: { select: { id: true, name: true } }
    }
  });

  // Log activity
  await logActivity(
    prisma,
    context,
    "created task",
    "Task",
    `Created task: ${task.title}`,
    task.id,
    task.title,
    projectId
  );

  // Broadcast real-time event
  broadcastEntityEvent(
    broadcastToOrganization,
    context.organizationId,
    'task_created',
    {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      projectName: task.project?.name,
      assigneeId: task.assigneeId,
      assigneeName: task.assignee?.name
    },
    context.userId
  );

  return NextResponse.json({ task });
});
