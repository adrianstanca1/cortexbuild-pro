import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

// GET - Fetch onboarding logs for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    if (!user.organizationId) {
      return NextResponse.json({ logs: [] });
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        userId: user.id,
        action: { contains: "onboarding" },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(bigintSafe({ logs }));
  } catch (error) {
    console.error("Error fetching onboarding logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

// POST - Create onboarding log entry
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const { step, status, description, metadata } = body;

    if (!user.organizationId) {
      // Create log without organization for new users
      const log = await prisma.auditLog.create({
        data: {
          action: `onboarding_${step}`.toUpperCase(),
          entityType: "Onboarding",
          entityId: user.id,
          entityName: step,
          details: description || `Step ${step} ${status}`,
          userId: user.id,
          metadata: metadata || {},
        },
      });

      return NextResponse.json(bigintSafe({ log }));
    }

    const log = await prisma.auditLog.create({
      data: {
        action: `onboarding_${step}`.toUpperCase(),
        entityType: "Onboarding",
        entityId: user.organizationId,
        entityName: step,
        details: description || `Step ${step} ${status}`,
        userId: user.id,
        metadata: metadata || {},
      },
    });

    return NextResponse.json(bigintSafe({ log }));
  } catch (error) {
    console.error("Error creating onboarding log:", error);
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}
