import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { TeamClient } from "./_components/team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;
  const userRole = (session?.user as any)?.role;

  const teamMembers = await prisma.teamMember.findMany({
    where: orgId ? { organizationId: orgId } : {},
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      projectAssignments: {
        include: { project: { select: { id: true, name: true } } }
      }
    },
    orderBy: { invitedAt: "desc" }
  });

  return (
    <TeamClient
      teamMembers={JSON.parse(JSON.stringify(teamMembers ?? []))}
      userRole={userRole}
      organizationId={orgId ?? ""}
    />
  );
}
