export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id || '';
    const organizationId = (session.user as { organizationId?: string })?.organizationId;
    const body = await request.json();
    const { title, description, assigneeId, priority, status, dueDate } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "COMPLETE") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.update({
      where: { id: id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "updated task",
        entityType: "Task",
        entityId: task.id,
        entityName: task.title,
        userId,
        projectId: task.projectId
      }
    });

    // Broadcast real-time event to organization
    if (organizationId) {
      broadcastToOrganization(organizationId, {
        type: 'task_updated',
        timestamp: new Date().toISOString(),
        payload: {
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            projectId: task.projectId,
            projectName: task.project.name,
            assigneeId: task.assigneeId,
            assigneeName: task.assignee?.name,
            dueDate: task.dueDate,
            completedAt: task.completedAt
          },
          changes: Object.keys(updateData),
          userId
        }
      });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id;
    const organizationId = (session.user as { organizationId?: string })?.organizationId;

    // Fetch task before deletion for broadcast
    const task = await prisma.task.findUnique({
      where: { id: id },
      include: { project: { select: { id: true, name: true } } }
    });

    await prisma.task.delete({ where: { id: id } });

    // Broadcast real-time event to organization
    if (organizationId && task) {
      broadcastToOrganization(organizationId, {
        type: 'task_deleted',
        timestamp: new Date().toISOString(),
        payload: {
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          projectName: task.project.name,
          userId
        }
      });
    }

    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
