import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DrawingsClient } from "./_components/drawings-client";

export default async function DrawingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    redirect("/login");
  }

  const [drawings, projects] = await Promise.all([
    prisma.drawing.findMany({
      where: {
        project: { organizationId },
      },
      include: {
        project: { select: { id: true, name: true } },
        revisions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { number: "asc" },
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
        <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Drawing Register</h1>
        <p className="text-muted-foreground">Manage project drawings and revisions</p>
      </div>
      <DrawingsClient
        drawings={JSON.parse(JSON.stringify(drawings))}
        projects={JSON.parse(JSON.stringify(projects))}
      />
    </div>
  );
}
