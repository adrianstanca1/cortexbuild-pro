import { getServerSession } from "next-auth";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { CompanyDashboardClient } from "./_components/dashboard-client";
import { parseEntitlements } from "@/lib/entitlements";

export default async function CompanyDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  // Fetch organization with all related data
  const [organizationData, teamMembers, projects, recentActivity, pendingInvitations] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
            teamMembers: true,
          }
        }
      }
    }),
    prisma.teamMember.findMany({
      where: { organizationId: user.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            lastLogin: true,
          }
        }
      },
      take: 5,
      orderBy: { invitedAt: "desc" }
    }),
    prisma.project.findMany({
      where: { organizationId: user.organizationId },
      include: {
        _count: {
          select: { tasks: true }
        },
        manager: {
          select: { name: true }
        }
      },
      take: 5,
      orderBy: { updatedAt: "desc" }
    }),
    prisma.activityLog.findMany({
      where: {
        user: { organizationId: user.organizationId }
      },
      include: {
        user: {
          select: { name: true }
        }
      },
      take: 10,
      orderBy: { createdAt: "desc" }
    }),
    prisma.teamInvitation.count({
      where: {
        organizationId: user.organizationId,
        status: "PENDING"
      }
    })
  ]);

  // Convert BigInt to Number for serialization
  const organization = organizationData ? {
    ...organizationData,
    storageUsedBytes: Number(organizationData.storageUsedBytes),
  } : null;

  const entitlements = parseEntitlements(organization?.entitlements);

  const stats = {
    totalMembers: organization?._count.teamMembers || 0,
    totalProjects: organization?._count.projects || 0,
    storageUsedGB: organization ? organization.storageUsedBytes / (1024 * 1024 * 1024) : 0,
    maxUsers: entitlements.limits.maxUsers,
    maxProjects: entitlements.limits.maxProjects,
    storageGB: entitlements.limits.storageGB,
    pendingInvitations,
  };

  return (
    <CompanyDashboardClient
      organization={organization}
      entitlements={entitlements}
      stats={stats}
      teamMembers={JSON.parse(JSON.stringify(teamMembers))}
      projects={JSON.parse(JSON.stringify(projects))}
      recentActivity={JSON.parse(JSON.stringify(recentActivity))}
    />
  );
}
