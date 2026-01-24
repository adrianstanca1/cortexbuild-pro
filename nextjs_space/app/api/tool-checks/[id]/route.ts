import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;

    const check = await prisma.toolCheck.findFirst({
      where: {
        id: params.id,
        project: { organizationId: orgId }
      },
      include: {
        project: { select: { id: true, name: true } },
        inspector: { select: { id: true, name: true, email: true } }
      }
    });

    if (!check) {
      return NextResponse.json({ error: "Tool check not found" }, { status: 404 });
    }

    return NextResponse.json({ check });
  } catch (error) {
    console.error("Error fetching tool check:", error);
    return NextResponse.json({ error: "Failed to fetch tool check" }, { status: 500 });
  }
}

export async function PATCH(
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

    const existing = await prisma.toolCheck.findFirst({
      where: { id: params.id, project: { organizationId: orgId } }
    });

    if (!existing) {
      return NextResponse.json({ error: "Tool check not found" }, { status: 404 });
    }

    const check = await prisma.toolCheck.update({
      where: { id: params.id },
      data: body,
      include: {
        project: { select: { id: true, name: true } },
        inspector: { select: { id: true, name: true } }
      }
    });

    broadcastToOrganization(orgId, {
      type: "tool_check_updated",
      data: { check }
    });

    return NextResponse.json({ check });
  } catch (error) {
    console.error("Error updating tool check:", error);
    return NextResponse.json({ error: "Failed to update tool check" }, { status: 500 });
  }
}
