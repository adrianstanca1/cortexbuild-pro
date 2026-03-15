import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

// Force dynamic rendering
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

    const log = await prisma.siteAccessLog.findUnique({
      where: { id: id },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        recordedBy: { select: { id: true, name: true } },
        entryLog: true,
        exitLogs: true,
      },
    });

    if (!log) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error fetching site access log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Sign out endpoint - creates an EXIT record linked to the entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Get the entry log
    const entryLog = await prisma.siteAccessLog.findUnique({
      where: { id: id },
      include: { project: { select: { id: true, organizationId: true } } },
    });

    if (!entryLog) {
      return NextResponse.json(
        { error: "Entry log not found" },
        { status: 404 },
      );
    }

    // Check if already signed out
    const existingExit = await prisma.siteAccessLog.findFirst({
      where: { entryLogId: id, accessType: "EXIT" },
    });

    if (existingExit) {
      return NextResponse.json(
        { error: "Already signed out" },
        { status: 400 },
      );
    }

    // Create exit log
    const exitLog = await prisma.siteAccessLog.create({
      data: {
        accessType: "EXIT",
        accessTime: new Date(),
        userId: entryLog.userId,
        personName: entryLog.personName,
        company: entryLog.company,
        role: entryLog.role,
        badgeNumber: entryLog.badgeNumber,
        signatureData: data.signatureData,
        signatureIp: data.signatureData ? ip : null,
        entryLogId: id,
        projectId: entryLog.projectId,
        recordedById: session.user.id,
        notes: data.notes,
      },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        recordedBy: { select: { id: true, name: true } },
        entryLog: { select: { id: true, accessTime: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "signed_out",
        entityType: "SiteAccess",
        entityId: exitLog.id,
        entityName: `${entryLog.personName} - Sign Out`,
        userId: session.user.id,
        projectId: entryLog.projectId,
      },
    });

    broadcastToOrganization(entryLog.project.organizationId, {
      type: "site_exit",
      data: exitLog,
    });

    return NextResponse.json(exitLog);
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
