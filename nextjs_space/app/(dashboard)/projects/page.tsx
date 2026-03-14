import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { ProjectsClient } from "./_components/projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;

  const projects = await prisma.project.findMany({
    where: orgId ? { organizationId: orgId } : {},
    include: {
      manager: { select: { id: true, name: true, avatarUrl: true } },
      tasks: {
        select: {
          id: true,
          status: true,
          priority: true,
          dueDate: true
        }
      },
      _count: { 
        select: { 
          tasks: true, 
          documents: true, 
          teamMembers: true,
          rfis: true,
          changeOrders: true,
          safetyIncidents: true
        } 
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return <ProjectsClient projects={JSON.parse(JSON.stringify(projects ?? []))} />;
}
