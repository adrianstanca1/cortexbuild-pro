import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DeploymentClient } from "./_components/deployment-client";

export const dynamic = "force-dynamic";

export default async function DeploymentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role;
  const organizationId = (session.user as any).organizationId;

  // Only admins can access deployment dashboard
  const canAccessDeployment = ["ADMIN", "COMPANY_OWNER", "SUPER_ADMIN"].includes(userRole);

  if (!canAccessDeployment) {
    redirect("/dashboard");
  }

  // Fetch deployment-related data
  const [projects, teamMembers, activities] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        budget: true,
        createdAt: true,
        _count: { select: { tasks: true, teamMembers: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.teamMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { invitedAt: "desc" }
    }),
    prisma.activityLog.findMany({
      where: { project: { organizationId } },
      include: {
        user: { select: { name: true } },
        project: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  return (
    <DeploymentClient
      projects={JSON.parse(JSON.stringify(projects))}
      teamMembers={JSON.parse(JSON.stringify(teamMembers))}
      activities={JSON.parse(JSON.stringify(activities))}
      userRole={userRole}
      organizationId={organizationId ?? ""}
    />
  );
}
