import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { TasksClient } from "./_components/tasks-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.project.findMany({
      where: orgId ? { organizationId: orgId, status: { not: "ARCHIVED" } } : {},
      select: { id: true, name: true }
    })
  ]);

  const teamMembers = await prisma.teamMember.findMany({
    where: orgId ? { organizationId: orgId } : {},
    include: { user: { select: { id: true, name: true } } }
  });

  return (
    <TasksClient
      tasks={JSON.parse(JSON.stringify(tasks ?? []))}
      projects={JSON.parse(JSON.stringify(projects ?? []))}
      teamMembers={JSON.parse(JSON.stringify(teamMembers ?? []))}
    />
  );
}
