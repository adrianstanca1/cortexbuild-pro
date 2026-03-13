import { Suspense } from "react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { ReportGeneratorClient } from "./_components/report-generator-client";

export const metadata = {
  title: "AI Report Generator | CortexBuild Pro",
  description: "Generate comprehensive AI-powered project reports"
};

export default async function ReportGeneratorPage() {
  const bigintSafe = (obj: any) => JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? Number(v) : v));


  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const organizationId = (session.user as any).organizationId;

  const projects = await prisma.project.findMany({
    where: { 
      organizationId,
      status: { in: ["IN_PROGRESS", "PLANNING", "ON_HOLD"] }
    },
    include: {
      _count: {
        select: {
          tasks: true,
          teamMembers: true,
          dailyReports: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const serializedProjects = bigintSafe(projects);

  return (
    <Suspense fallback={<div className="p-8">Loading report generator...</div>}>
      <ReportGeneratorClient projects={serializedProjects} />
    </Suspense>
  );
}
