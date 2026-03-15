import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { MeetingsClient } from "./_components/meetings-client";

export default async function MeetingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const [projects, meetings] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
    }),
    prisma.meetingMinutes.findMany({
      where: { project: { organizationId: session.user.organizationId } },
      include: {
        project: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true } },
        _count: { select: { attendees: true, actionItems: true } },
      },
      orderBy: { meetingDate: "desc" },
    }),
  ]);

  return (
    <MeetingsClient
      meetings={JSON.parse(JSON.stringify(meetings))}
      projects={projects}
    />
  );
}
