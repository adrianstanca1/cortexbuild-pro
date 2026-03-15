import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { SettingsClient } from "./_components/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;

  let organization: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
  } | null = null;
  if (orgId) {
    organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true, createdAt: true },
    });
  }

  return (
    <SettingsClient
      user={session?.user}
      organization={
        organization ? JSON.parse(JSON.stringify(organization)) : null
      }
    />
  );
}
