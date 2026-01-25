export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { logAndBroadcast } from "@/lib/query-builders";

export const GET = withAuth(async (request: NextRequest, context) => {
  const tasks = await prisma.task.findMany({
    where: { project: { organizationId: context.organizationId } },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, avatarUrl: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return successResponse({ tasks });
});

export const POST = withAuth(async (request: NextRequest, context) => {
  const body = await request.json();
  const { title, description, projectId, assigneeId, priority, status, dueDate } = body;

  if (!title?.trim()) {
    return errorResponse("BAD_REQUEST", "Task title is required");
  }

  if (!projectId) {
    return errorResponse("BAD_REQUEST", "Project ID is required");
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
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

  await logAndBroadcast(context, "created task", "Task", task, projectId);

  return successResponse({ task });
});
