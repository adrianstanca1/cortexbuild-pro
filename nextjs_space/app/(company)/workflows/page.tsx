import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { WorkflowsClient } from "./_components/workflows-client";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;

  if (!orgId) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="text-lg font-semibold text-yellow-800">
            Organization Required
          </h2>
          <p className="text-yellow-600 mt-2">
            Please select an organization to access workflows.
          </p>
        </div>
      </div>
    );
  }

  const workflows = await prisma.automationRule.findMany({
    where: { organizationId: orgId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      executionLogs: {
        orderBy: { executedAt: "desc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <WorkflowsClient workflows={JSON.parse(JSON.stringify(workflows ?? []))} />;
}
