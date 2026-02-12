import { Suspense } from "react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { ComplianceDashboardClient } from "./_components/compliance-dashboard-client";

export const metadata = {
  title: "CDM 2015 Compliance | CortexBuild Pro",
  description: "Construction Design and Management Regulations 2015 compliance tracker"
};

export default async function CompliancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const organizationId = (session.user as any).organizationId;

  // Fetch all active projects
  const projects = await prisma.project.findMany({
    where: { 
      organizationId,
      status: { in: ["IN_PROGRESS", "PLANNING", "ON_HOLD"] }
    },
    include: {
      _count: {
        select: {
          tasks: true,
          riskAssessments: true,
          toolboxTalks: true,
          inspections: true,
          safetyIncidents: true,
          dailyReports: true,
          documents: true,
          teamMembers: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const serializedProjects = JSON.parse(JSON.stringify(projects));

  return (
    <Suspense fallback={<div className="p-8">Loading compliance dashboard...</div>}>
      <ComplianceDashboardClient projects={serializedProjects} />
    </Suspense>
  );
}
