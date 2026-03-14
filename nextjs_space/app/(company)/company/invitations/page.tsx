import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { TeamInvitationsClient } from "./_components/invitations-client";

export default async function TeamInvitationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  if (!["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  return <TeamInvitationsClient userRole={user.role} />;
}
