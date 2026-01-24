import { CompanyUsageClient } from './usage-client';

export default function CompanyUsagePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Company Usage</h1>
      <CompanyUsageClient />
    </div>
  );
}
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { UsageClient } from "./_components/usage-client";
import { parseEntitlements } from "@/lib/entitlements";

export default async function UsagePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  const organizationData = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    include: {
      _count: {
        select: {
          users: true,
          projects: true,
          teamMembers: true,
        }
      }
    }
  });

  // Convert BigInt to Number for serialization
  const organization = organizationData ? {
    ...organizationData,
    storageUsedBytes: Number(organizationData.storageUsedBytes),
  } : null;

  const entitlements = parseEntitlements(organization?.entitlements);

  // Get document count and total size
  const documents = await prisma.document.findMany({
    where: {
      project: { organizationId: user.organizationId }
    },
    select: { fileSize: true, documentType: true }
  });

  const totalDocumentSize = documents.reduce((sum: number, doc: any) => sum + (Number(doc.fileSize) || 0), 0);
  const documentsByType = documents.reduce((acc: any, doc: any) => {
    acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get counts by project status
  const projectsByStatus = await prisma.project.groupBy({
    by: ["status"],
    where: { organizationId: user.organizationId },
    _count: { status: true }
  });

  const usageData = {
    teamMembers: organization?._count.teamMembers || 0,
    maxUsers: entitlements.limits.maxUsers,
    projects: organization?._count.projects || 0,
    maxProjects: entitlements.limits.maxProjects,
    storageUsedBytes: organization?.storageUsedBytes || 0,
    storageGB: entitlements.limits.storageGB,
    documentsCount: documents.length,
    documentsByType,
    totalDocumentSize,
    projectsByStatus: projectsByStatus.reduce((acc: any, p: any) => {
      acc[p.status] = p._count.status;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <UsageClient
      usageData={usageData}
      entitlements={entitlements}
    />
  );
}
