import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { PayrollClient } from "./_components/payroll-client";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  const organizationId = (session.user as any).organizationId;

  // Role-based access control: Only managers and admins can access payroll
  const canAccessPayroll = ["ADMIN", "COMPANY_OWNER", "COMPANY_ADMIN", "SUPER_ADMIN"].includes(userRole);

  if (!canAccessPayroll) {
    redirect("/dashboard");
  }

  // Fetch team members as employees with their user data
  const employees = await prisma.teamMember.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { invitedAt: "desc" }
  });

  // Fetch existing payroll records if the model exists
  let payrollItems = [];
  try {
    payrollItems = await prisma.payroll.findMany({
      where: { organizationId },
      include: {
        employee: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: { period: "desc" }
    });
  } catch (e) {
    // Payroll table may not exist yet
    payrollItems = [];
  }

  return (
    <PayrollClient
      employees={JSON.parse(JSON.stringify(employees ?? []))}
      payrollItems={JSON.parse(JSON.stringify(payrollItems ?? []))}
      userRole={userRole}
      organizationId={organizationId ?? ""}
    />
  );
}
