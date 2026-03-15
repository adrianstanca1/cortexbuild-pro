import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { BudgetClient } from "./_components/budget-client";

export default async function BudgetPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const [projects, costItems, subcontractors] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true, budget: true },
      orderBy: { name: "asc" },
    }),
    prisma.costItem.findMany({
      where: {
        project: { organizationId: session.user.organizationId },
      },
      include: {
        project: { select: { id: true, name: true } },
        subcontractor: { select: { id: true, companyName: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subcontractor.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  const summary = costItems.reduce(
    (acc: any, item: any) => {
      acc.totalEstimated += item.estimatedAmount;
      acc.totalCommitted += item.committedAmount;
      acc.totalActual += item.actualAmount;
      return acc;
    },
    { totalEstimated: 0, totalCommitted: 0, totalActual: 0 },
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Budget & Cost Tracking
        </h1>
        <p className="text-gray-500">
          Track project costs, budgets, and expenditures
        </p>
      </div>
      <BudgetClient
        initialCostItems={JSON.parse(JSON.stringify(costItems))}
        initialSummary={summary}
        projects={JSON.parse(JSON.stringify(projects))}
        subcontractors={JSON.parse(JSON.stringify(subcontractors))}
      />
    </div>
  );
}
