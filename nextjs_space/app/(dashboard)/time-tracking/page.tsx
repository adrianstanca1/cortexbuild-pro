import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import TimeTrackingClient from "./_components/time-tracking-client";

export const dynamic = "force-dynamic";

export default async function TimeTrackingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const [projects, tasks, timeEntries, teamMembers] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    }),
    prisma.task.findMany({
      where: { project: { organizationId: session.user.organizationId } },
      select: { id: true, title: true, projectId: true },
      orderBy: { title: "asc" }
    }),
    prisma.timeEntry.findMany({
      where: { project: { organizationId: session.user.organizationId } },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } }
      },
      orderBy: { date: "desc" },
      take: 100
    }),
    prisma.teamMember.findMany({
      where: { organizationId: session.user.organizationId },
      include: { user: { select: { id: true, name: true, email: true } } }
    })
  ]);

  return (
    <TimeTrackingClient
      projects={JSON.parse(JSON.stringify(projects))}
      tasks={JSON.parse(JSON.stringify(tasks))}
      initialEntries={JSON.parse(JSON.stringify(timeEntries))}
      teamMembers={JSON.parse(JSON.stringify(teamMembers))}
      currentUserId={session.user.id}
      userRole={session.user.role ?? "FIELD_WORKER"}
    />
  );
}
