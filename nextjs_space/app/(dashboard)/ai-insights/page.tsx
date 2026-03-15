import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { AIInsightsClient } from "./_components/ai-insights-client";

export const dynamic = "force-dynamic";

export default async function AIInsightsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const orgId = (session.user as { organizationId?: string })?.organizationId;

  const [projects, openTasks, openRFIs, activeIncidents] = await Promise.all([
    prisma.project.findMany({
      where: orgId ? { organizationId: orgId } : {},
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
    }),
    orgId
      ? prisma.task.count({
          where: {
            project: { organizationId: orgId },
            status: { not: "COMPLETE" },
          },
        })
      : Promise.resolve(0),
    orgId
      ? prisma.rFI.count({
          where: {
            project: { organizationId: orgId },
            status: { in: ["OPEN", "DRAFT"] },
          },
        })
      : Promise.resolve(0),
    orgId
      ? prisma.safetyIncident.count({
          where: {
            project: { organizationId: orgId },
            status: { not: "CLOSED" },
          },
        })
      : Promise.resolve(0),
  ]);

  return (
    <AIInsightsClient
      projects={JSON.parse(JSON.stringify(projects))}
      stats={{
        openTasks,
        openRFIs,
        activeIncidents,
        projectCount: projects.length,
      }}
      ollamaModel={process.env.OLLAMA_MODEL || "qwen2.5:7b"}
    />
  );
}
