import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// PATCH - Update organization settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    
    // Only COMPANY_OWNER or SUPER_ADMIN can update settings
    if (!["SUPER_ADMIN", "COMPANY_OWNER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const body = await req.json();
    const { name, _description, _website, _email, _phone, _address } = body;

    // Validate name is not empty
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: "Organization name cannot be empty" }, { status: 400 });
    }

    const updated = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        ...(name && { name: name.trim() }),
        // Note: These fields would need to be added to the schema if not present
        // For now, we'll only update the name
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "Updated organization settings",
        entityType: "Organization",
        entityId: user.organizationId,
        entityName: updated.name,
        userId: user.id,
      }
    });

    return NextResponse.json({ organization: updated });
  } catch {
    console.error("Error updating organization settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

// GET - Get organization settings
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    if (!user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch {
    console.error("Error fetching organization settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
