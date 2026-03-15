import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DocumentsClient } from "./_components/documents-client";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;

  const [documents, projects] = await Promise.all([
    prisma.document.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: orgId
        ? { organizationId: orgId, status: { not: "ARCHIVED" } }
        : {},
      select: { id: true, name: true },
    }),
  ]);

  return (
    <DocumentsClient
      documents={JSON.parse(JSON.stringify(documents ?? []))}
      projects={JSON.parse(JSON.stringify(projects ?? []))}
    />
  );
}
