import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { ProgressClaimsClient } from "./_components/progress-claims-client";

export default async function ProgressClaimsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    redirect("/login");
  }

  const [claims, projects] = await Promise.all([
    prisma.progressClaim.findMany({
      where: {
        project: { organizationId },
      },
      include: {
        project: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: "asc" } },
        documents: true,
      },
      orderBy: { number: "desc" },
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
        <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
          Progress Claims
        </h1>
        <p className="text-muted-foreground">
          Manage payment applications and progress billing
        </p>
      </div>
      <ProgressClaimsClient
        claims={JSON.parse(JSON.stringify(claims))}
        projects={JSON.parse(JSON.stringify(projects))}
      />
    </div>
  );
}
