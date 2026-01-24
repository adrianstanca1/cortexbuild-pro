import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export const dynamic = "force-dynamic";

// Add attendee signature to toolbox talk
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orgId = (session.user as any).organizationId;
    const body = await request.json();

    const { name, company, trade, signatureData } = body;

    if (!name || !signatureData) {
      return NextResponse.json(
        { error: "Name and signature are required" },
        { status: 400 }
      );
    }

    // Verify toolbox talk exists
    const toolboxTalk = await prisma.toolboxTalk.findFirst({
      where: { id: params.id, project: { organizationId: orgId } }
    });

    if (!toolboxTalk) {
      return NextResponse.json({ error: "Toolbox talk not found" }, { status: 404 });
    }

    // Get IP address for audit
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Create or update attendee record
    const attendee = await prisma.toolboxTalkAttendee.upsert({
      where: {
        toolboxTalkId_userId: {
          toolboxTalkId: params.id,
          userId: userId
        }
      },
      create: {
        toolboxTalkId: params.id,
        userId: userId,
        name,
        company: company || null,
        trade: trade || null,
        signatureData,
        signedAt: new Date(),
        signatureIp: ip,
        acknowledged: true
      },
      update: {
        signatureData,
        signedAt: new Date(),
        signatureIp: ip,
        acknowledged: true
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    broadcastToOrganization(orgId, {
      type: "toolbox_talk_signed",
      data: { toolboxTalkId: params.id, attendee }
    });

    return NextResponse.json({ attendee });
  } catch (error) {
    console.error("Error signing toolbox talk:", error);
    return NextResponse.json({ error: "Failed to sign toolbox talk" }, { status: 500 });
  }
}

// Add guest attendee (non-registered user)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    const body = await request.json();

    const { name, company, trade, signatureData } = body;

    if (!name || !signatureData) {
      return NextResponse.json(
        { error: "Name and signature are required" },
        { status: 400 }
      );
    }

    // Verify toolbox talk exists
    const toolboxTalk = await prisma.toolboxTalk.findFirst({
      where: { id: params.id, project: { organizationId: orgId } }
    });

    if (!toolboxTalk) {
      return NextResponse.json({ error: "Toolbox talk not found" }, { status: 404 });
    }

    // Get IP address for audit
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Create guest attendee record (no userId)
    const attendee = await prisma.toolboxTalkAttendee.create({
      data: {
        toolboxTalkId: params.id,
        userId: null,
        name,
        company: company || null,
        trade: trade || null,
        signatureData,
        signedAt: new Date(),
        signatureIp: ip,
        acknowledged: true
      }
    });

    broadcastToOrganization(orgId, {
      type: "toolbox_talk_guest_signed",
      data: { toolboxTalkId: params.id, attendee }
    });

    return NextResponse.json({ attendee });
  } catch (error) {
    console.error("Error adding guest signature:", error);
    return NextResponse.json({ error: "Failed to add guest signature" }, { status: 500 });
  }
}
