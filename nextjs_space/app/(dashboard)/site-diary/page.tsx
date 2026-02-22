import { getServerSession } from "next-auth";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { SiteDiaryClient } from "./_components/site-diary-client";

export default async function SiteDiaryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    redirect("/login");
  }

  const [diaries, projects] = await Promise.all([
    prisma.siteDiary.findMany({
      where: {
        project: { organizationId },
      },
      include: {
        project: { select: { id: true, name: true } },
        entries: { orderBy: { time: "asc" } },
        photos: true,
      },
      orderBy: { date: "desc" },
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
        <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Site Diary</h1>
        <p className="text-muted-foreground">Daily site records, weather, and progress tracking</p>
      </div>
      <SiteDiaryClient
        diaries={JSON.parse(JSON.stringify(diaries))}
        projects={JSON.parse(JSON.stringify(projects))}
      />
    </div>
  );
}
