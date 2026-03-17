import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

// GET - Fetch onboarding state for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    if (!user.organizationId) {
      // User has no organization - start fresh onboarding
      return NextResponse.json({
        status: 'NOT_STARTED',
        currentStep: 0,
        companyInfo: null,
        teamInvites: [],
        planSelection: '',
        projectSetup: null,
      });
    }

    // Fetch organization data
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        _count: { select: { teamMembers: true, projects: true } },
        users: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Determine onboarding status based on data
    let currentStep = 1;
    let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';

    if (organization.name) {
      currentStep = 2;
      status = 'IN_PROGRESS';
    }

    if (organization._count.teamMembers > 1) {
      currentStep = 3;
    }

    if (organization._count.projects > 0) {
      currentStep = 4;
      status = 'COMPLETED';
    }

    return NextResponse.json(bigintSafe({
      status,
      currentStep,
      companyInfo: {
        name: organization.name,
        industry: (organization as any).industry || '',
        size: (organization as any).size || `${organization._count.teamMembers}`,
        description: (organization as any).description || '',
      },
      teamInvites: [],
      planSelection: (organization as any).plan || '',
      projectSetup: null,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        memberCount: organization._count.teamMembers,
        projectCount: organization._count.projects,
      }
    }));
  } catch (error) {
    console.error("Error fetching onboarding state:", error);
    return NextResponse.json({ error: "Failed to fetch onboarding state" }, { status: 500 });
  }
}

// PATCH - Update onboarding step data
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    if (!user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const body = await req.json();
    const { step, companyInfo, planSelection } = body;

    const updateData: any = {};

    if (step === 1 && companyInfo) {
      updateData.name = companyInfo.name;
      updateData.industry = companyInfo.industry;
      updateData.size = companyInfo.size;
      updateData.description = companyInfo.description;
    }

    if (step === 3 && planSelection) {
      updateData.plan = planSelection;
    }

    const updated = await prisma.organization.update({
      where: { id: user.organizationId },
      data: updateData,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "Updated onboarding step",
        entityType: "Organization",
        entityId: updated.id,
        entityName: updated.name,
        details: `Completed step ${step}`,
        userId: user.id,
      }
    });

    return NextResponse.json(bigintSafe({
      success: true,
      step,
      data: updateData,
    }));
  } catch (error) {
    console.error("Error updating onboarding:", error);
    return NextResponse.json({ error: "Failed to update onboarding" }, { status: 500 });
  }
}
