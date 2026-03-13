import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export const dynamic = "force-dynamic";

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const toolboxTalks = await prisma.toolboxTalk.findMany({
      where: {
        project: { organizationId: orgId },
        ...(projectId && { projectId }),
        ...(status && { status: status as any })
      },
      include: {
        project: { select: { id: true, name: true } },
        presenter: { select: { id: true, name: true, email: true } },
        attendees: {
          include: {
            user: { select: { id: true, name: true } }
          }
        },
        _count: { select: { attendees: true } }
      },
      orderBy: { date: "desc" },
      take: limit
    });

    return NextResponse.json(bigintSafe({ toolboxTalks }));
  } catch (error) {
    console.error("Error fetching toolbox talks:", error);
    return NextResponse.json({ error: "Failed to fetch toolbox talks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orgId = (session.user as any).organizationId;
    const body = await request.json();

    const {
      title,
      topic,
      description,
      date,
      startTime,
      endTime,
      location,
      projectId,
      keyPoints,
      hazardsDiscussed,
      safetyMeasures,
      weatherConditions,
      notes
    } = body;

    if (!title || !topic || !date || !projectId) {
      return NextResponse.json(
        { error: "Title, topic, date, and project are required" },
        { status: 400 }
      );
    }

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const toolboxTalk = await prisma.toolboxTalk.create({
      data: {
        title,
        topic,
        description: description || null,
        date: new Date(date),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        location: location || null,
        projectId,
        presenterId: userId,
        keyPoints: keyPoints || [],
        hazardsDiscussed: hazardsDiscussed || [],
        safetyMeasures: safetyMeasures || [],
        weatherConditions: weatherConditions || null,
        notes: notes || null,
        status: "SCHEDULED"
      },
      include: {
        project: { select: { id: true, name: true } },
        presenter: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "TOOLBOX_TALK_CREATED",
        entityType: "TOOLBOX_TALK",
        entityId: toolboxTalk.id,
        userId,
        projectId,
        details: JSON.stringify({ title: toolboxTalk.title, topic: toolboxTalk.topic })
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(orgId, {
      type: "toolbox_talk_created",
      data: { toolboxTalk }
    });

    return NextResponse.json(bigintSafe({ toolboxTalk }, { status: 201 }));
  } catch (error) {
    console.error("Error creating toolbox talk:", error);
    return NextResponse.json({ error: "Failed to create toolbox talk" }, { status: 500 });
  }
}
