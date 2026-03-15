import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { SubcontractorsClient } from "./_components/subcontractors-client";

export default async function SubcontractorsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const subcontractors = await prisma.subcontractor.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      contracts: {
        include: {
          project: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: { contracts: true, costItems: true },
      },
    },
    orderBy: { companyName: "asc" },
  });

  const totalContractValue = subcontractors.reduce((acc, sub) => {
    return acc + sub.contracts.reduce((sum, c) => sum + c.contractAmount, 0);
  }, 0);

  const activeContracts = subcontractors.reduce((acc, sub) => {
    return acc + sub.contracts.filter((c) => c.status === "ACTIVE").length;
  }, 0);

  const summary = {
    total: subcontractors.length,
    totalContractValue,
    activeContracts,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subcontractors</h1>
        <p className="text-gray-500">
          Manage subcontractors and their contracts
        </p>
      </div>
      <SubcontractorsClient
        initialSubcontractors={JSON.parse(JSON.stringify(subcontractors))}
        initialSummary={summary}
      />
    </div>
  );
}
