import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { PermitsClient } from "./_components/permits-client";

export const dynamic = "force-dynamic";

export default async function PermitsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    redirect("/login");
  }

  const [permits, projects] = await Promise.all([
    prisma.permit.findMany({
      where: {
        project: { organizationId },
      },
      include: {
        project: { select: { id: true, name: true } },
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Permit Tracking</h1>
        <p className="text-muted-foreground">Manage construction permits and approvals</p>
      </div>
      <PermitsClient
        permits={JSON.parse(JSON.stringify(permits))}
        projects={JSON.parse(JSON.stringify(projects))}
      />
    </div>
  );
}
