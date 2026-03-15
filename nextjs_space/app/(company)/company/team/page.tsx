import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { CompanyTeamClient } from "./_components/team-client";

export default async function CompanyTeamPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  if (!["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  const teamMembers = await prisma.teamMember.findMany({
    where: { organizationId: user.organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLogin: true,
          createdAt: true,
        },
      },
      projectAssignments: {
        include: {
          project: {
            select: { id: true, name: true, status: true },
          },
        },
      },
    },
    orderBy: { invitedAt: "desc" },
  });

  return (
    <CompanyTeamClient
      teamMembers={JSON.parse(JSON.stringify(teamMembers))}
      currentUserId={user.id}
      currentUserRole={user.role}
    />
  );
}
