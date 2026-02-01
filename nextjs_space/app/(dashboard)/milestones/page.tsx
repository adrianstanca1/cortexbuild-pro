import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import MilestonesClient from "./_components/milestones-client";

export const dynamic = "force-dynamic";

export default async function MilestonesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const [projects, milestones] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" }
    }),
    prisma.milestone.findMany({
      where: {
        project: { organizationId: session.user.organizationId }
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: [{ targetDate: "asc" }, { sortOrder: "asc" }]
    })
  ]);

  return (
    <MilestonesClient
      projects={JSON.parse(JSON.stringify(projects))}
      initialMilestones={JSON.parse(JSON.stringify(milestones))}
    />
  );
}
