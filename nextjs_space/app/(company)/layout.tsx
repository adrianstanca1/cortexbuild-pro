import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { CompanySidebar } from "./_components/sidebar";
import { CompanyHeader } from "./_components/header";
import { prisma } from "@/lib/db";

export default async function CompanyLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  
  // Only COMPANY_OWNER and ADMIN can access company management
  if (user.role !== "COMPANY_OWNER" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Fetch organization details
  const organizationData = user.organizationId 
    ? await prisma.organization.findUnique({
        where: { id: user.organizationId },
        include: {
          _count: {
            select: {
              users: true,
              projects: true,
              teamMembers: true,
            }
          }
        }
      })
    : null;

  // Convert BigInt to Number for serialization
  const organization = organizationData ? {
    ...organizationData,
    storageUsedBytes: Number(organizationData.storageUsedBytes),
  } : null;

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <CompanySidebar userRole={user.role} />
      <div className="lg:pl-64">
        <CompanyHeader 
          user={session.user} 
          organization={organization}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
