import { getServerSession } from "next-auth";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { MaterialsClient } from "./_components/materials-client";

export default async function MaterialsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const [projects, materials] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    }),
    prisma.material.findMany({
      where: {
        project: { organizationId: session.user.organizationId }
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const summary = materials.reduce(
    (acc: { totalValue: number; totalOrdered: number; totalReceived: number }, mat: { totalCost: number; quantityOrdered: number; quantityReceived: number }) => {
      acc.totalValue += mat.totalCost;
      acc.totalOrdered += mat.quantityOrdered;
      acc.totalReceived += mat.quantityReceived;
      return acc;
    },
    { totalValue: 0, totalOrdered: 0, totalReceived: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Materials Tracking</h1>
        <p className="text-gray-500">Track materials, deliveries, and inventory</p>
      </div>
      <MaterialsClient
        initialMaterials={JSON.parse(JSON.stringify(materials))}
        initialSummary={summary}
        projects={JSON.parse(JSON.stringify(projects))}
      />
    </div>
  );
}
