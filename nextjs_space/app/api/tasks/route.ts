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
  const tasks = await prisma.task.findMany({
    where: { project: { organizationId: context.organizationId } },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, avatarUrl: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ tasks });
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
    task.project?.organizationId,
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
