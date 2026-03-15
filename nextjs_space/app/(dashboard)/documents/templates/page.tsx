import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { TemplatesClient } from "./_components/templates-client";

export const dynamic = "force-dynamic";

export default async function DocumentTemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const orgId = (session.user as { organizationId?: string })?.organizationId;

  const templates = await prisma.documentTemplate.findMany({
    where: {
      isActive: true,
      OR: [
        { isSystemTemplate: true },
        ...(orgId ? [{ organizationId: orgId }] : []),
      ],
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [
      { isSystemTemplate: "desc" },
      { usageCount: "desc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <TemplatesClient templates={JSON.parse(JSON.stringify(templates))} />
    </div>
  );
}
