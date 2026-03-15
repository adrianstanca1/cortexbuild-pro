import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { ChangeOrdersClient } from "./_components/change-orders-client";

export default async function ChangeOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const organizationId = session.user.organizationId;
  if (!organizationId) redirect("/login");

  const [projects, changeOrders] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true, budget: true },
      orderBy: { name: "asc" },
    }),
    prisma.changeOrder.findMany({
      where: {
        project: { organizationId },
      },
      include: {
        project: { select: { id: true, name: true, budget: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <ChangeOrdersClient
      initialChangeOrders={JSON.parse(JSON.stringify(changeOrders))}
      projects={JSON.parse(JSON.stringify(projects))}
      userRole={session.user.role}
    />
  );
}
