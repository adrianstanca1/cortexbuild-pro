import { getServerSession } from "next-auth";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DefectsClient } from "./_components/defects-client";

export default async function DefectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    redirect("/login");
  }

  const [defects, projects, teamMembers] = await Promise.all([
    prisma.defect.findMany({
      where: {
        project: { organizationId },
      },
      include: {
        project: { select: { id: true, name: true } },
        photos: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Defect / Snag List</h1>
        <p className="text-muted-foreground">Track and manage construction defects and issues</p>
      </div>
      <DefectsClient
        defects={JSON.parse(JSON.stringify(defects))}
        projects={JSON.parse(JSON.stringify(projects))}
        teamMembers={JSON.parse(JSON.stringify(teamMembers))}
      />
    </div>
  );
}
