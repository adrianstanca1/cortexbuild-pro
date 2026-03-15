import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

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

    const check = await prisma.mEWPCheck.findFirst({
      where: {
        id: id,
        project: { organizationId: orgId },
      },
      include: {
        project: { select: { id: true, name: true } },
        operator: { select: { id: true, name: true, email: true } },
        supervisor: { select: { id: true, name: true, email: true } },
        equipment: { select: { id: true, name: true, equipmentNumber: true } },
      },
    });

    if (!check) {
      return NextResponse.json(
        { error: "MEWP check not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ check });
  } catch (error) {
    console.error("Error fetching MEWP check:", error);
    return NextResponse.json(
      { error: "Failed to fetch MEWP check" },
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

    const existing = await prisma.mEWPCheck.findFirst({
      where: { id: id, project: { organizationId: orgId } },
      include: { project: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "MEWP check not found" },
        { status: 404 },
      );
    }

    // Handle supervisor sign-off
    const updateData: any = { ...body };
    if (body.supervisorSignature && !existing.supervisorSignedAt) {
      updateData.supervisorId = userId;
      updateData.supervisorSignedAt = new Date();
    }

    const check = await prisma.mEWPCheck.update({
      where: { id: id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        operator: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
      },
    });

    broadcastToOrganization(orgId, {
      type: "mewp_check_updated",
      data: { check },
    });

    return NextResponse.json({ check });
  } catch (error) {
    console.error("Error updating MEWP check:", error);
    return NextResponse.json(
      { error: "Failed to update MEWP check" },
      { status: 500 },
    );
  }
}
