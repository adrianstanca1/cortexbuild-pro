import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import { sendToolboxTalkCompletedNotification } from "@/lib/email-notifications";

export const dynamic = "force-dynamic";

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

    const orgId = (session.user as any).organizationId;

    const toolboxTalk = await prisma.toolboxTalk.findFirst({
      where: {
        id: id,
        project: { organizationId: orgId },
      },
      include: {
        project: { select: { id: true, name: true } },
        presenter: { select: { id: true, name: true, email: true } },
        attendees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!toolboxTalk) {
      return NextResponse.json(
        { error: "Toolbox talk not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ toolboxTalk });
  } catch (error) {
    console.error("Error fetching toolbox talk:", error);
    return NextResponse.json(
      { error: "Failed to fetch toolbox talk" },
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

    const userId = (session.user as any).id;
    const orgId = (session.user as any).organizationId;
    const body = await request.json();

    // Verify toolbox talk exists and belongs to org
    const existing = await prisma.toolboxTalk.findFirst({
      where: { id: id, project: { organizationId: orgId } },
      include: { project: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Toolbox talk not found" },
        { status: 404 },
      );
    }

    const toolboxTalk = await prisma.toolboxTalk.update({
      where: { id: id },
      data: {
        title: body.title,
        topic: body.topic,
        description: body.description,
        date: body.date ? new Date(body.date) : undefined,
        startTime: body.startTime ? new Date(body.startTime) : null,
        endTime: body.endTime ? new Date(body.endTime) : null,
        location: body.location,
        status: body.status,
        keyPoints: body.keyPoints,
        hazardsDiscussed: body.hazardsDiscussed,
        safetyMeasures: body.safetyMeasures,
        weatherConditions: body.weatherConditions,
        notes: body.notes,
      },
      include: {
        project: { select: { id: true, name: true } },
        presenter: { select: { id: true, name: true } },
        attendees: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "TOOLBOX_TALK_UPDATED",
        entityType: "TOOLBOX_TALK",
        entityId: toolboxTalk.id,
        userId,
        projectId: existing.projectId,
        details: JSON.stringify({
          title: toolboxTalk.title,
          status: toolboxTalk.status,
        }),
      },
    });

    broadcastToOrganization(orgId, {
      type: "toolbox_talk_updated",
      data: { toolboxTalk },
    });

    // Send email notification when completed
    if (body.status === "COMPLETED" && existing.status !== "COMPLETED") {
      sendToolboxTalkCompletedNotification(
        {
          id: toolboxTalk.id,
          title: toolboxTalk.title,
          topic: toolboxTalk.topic,
          location: toolboxTalk.location,
          attendeeCount: toolboxTalk.attendees?.length || 0,
          presenterName: toolboxTalk.presenter?.name,
          projectName: toolboxTalk.project.name,
          completedAt: new Date(),
        },
        "adrian.stanca1@gmail.com",
      ).catch((err) => console.error("Email notification error:", err));
    }

    return NextResponse.json({ toolboxTalk });
  } catch (error) {
    console.error("Error updating toolbox talk:", error);
    return NextResponse.json(
      { error: "Failed to update toolbox talk" },
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

    const orgId = (session.user as any).organizationId;
    const userId = (session.user as any).id;

    const existing = await prisma.toolboxTalk.findFirst({
      where: { id: id, project: { organizationId: orgId } },
      include: { project: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Toolbox talk not found" },
        { status: 404 },
      );
    }

    await prisma.toolboxTalk.delete({ where: { id: id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "TOOLBOX_TALK_DELETED",
        entityType: "TOOLBOX_TALK",
        entityId: id,
        userId,
        projectId: existing.projectId,
        details: JSON.stringify({ title: existing.title }),
      },
    });

    broadcastToOrganization(orgId, {
      type: "toolbox_talk_deleted",
      data: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting toolbox talk:", error);
    return NextResponse.json(
      { error: "Failed to delete toolbox talk" },
      { status: 500 },
    );
  }
}
