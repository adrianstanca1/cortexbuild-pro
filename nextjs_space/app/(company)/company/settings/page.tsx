import { getServerSession } from "next-auth";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { CompanySettingsClient } from "./_components/settings-client";

export default async function CompanySettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  if (!["SUPER_ADMIN", "COMPANY_OWNER"].includes(user.role)) {
    redirect("/dashboard");
  }

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });

  return (
    <CompanySettingsClient 
      organization={organization ? JSON.parse(JSON.stringify(organization)) : null}
      userRole={user.role}
    />
  );
}
