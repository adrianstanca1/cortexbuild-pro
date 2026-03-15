import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { SafetyClient } from "./_components/safety-client";

export default async function SafetyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const organizationId = session.user.organizationId;
  if (!organizationId) redirect("/login");

  const [projects, incidents, teamMembers] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.safetyIncident.findMany({
      where: {
        project: { organizationId },
      },
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { incidentDate: "desc" },
    }),
    prisma.teamMember.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <SafetyClient
      initialIncidents={JSON.parse(JSON.stringify(incidents))}
      projects={JSON.parse(JSON.stringify(projects))}
      teamMembers={JSON.parse(JSON.stringify(teamMembers))}
    />
  );
}
