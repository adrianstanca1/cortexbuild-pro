import { Suspense } from "react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { AIInsightsClient } from "./_components/ai-insights-client";

export const metadata = {
  title: "AI Insights | CortexBuild Pro",
  description: "AI-powered predictive analytics and intelligence"
};

export default async function AIInsightsPage() {
  const bigintSafe = (obj: any) => JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? Number(v) : v));


  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const organizationId = (session.user as any).organizationId;

  // Fetch all projects for the organization
  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: {
          tasks: true,
          riskRegister: true,
          defects: true,
          safetyIncidents: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Fetch recent predictive signals
  const signals = await prisma.predictiveSignal.findMany({
    where: {
      project: { organizationId }
    },
    include: {
      project: {
        select: { id: true, name: true, status: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  // Serialize data (BigInt-safe)
  const serializedProjects = bigintSafe(projects);
  const serializedSignals = bigintSafe(signals);

  return (
    <Suspense fallback={<div>Loading AI Insights...</div>}>
      <AIInsightsClient 
        projects={serializedProjects}
        signals={serializedSignals}
      />
    </Suspense>
  );
}
