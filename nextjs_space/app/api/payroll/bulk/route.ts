export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

async function hasPayrollPermissions(userRole: string | undefined): Promise<boolean> {
  return ["ADMIN", "COMPANY_OWNER", "COMPANY_ADMIN", "SUPER_ADMIN"].includes(userRole as string);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (!await hasPayrollPermissions(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const body = await request.json();
    const { payrolls, cisRate } = body;

    if (!Array.isArray(payrolls) || payrolls.length === 0) {
      return NextResponse.json({ error: "Payrolls array is required and must not be empty" }, { status: 400 });
    }

    // Validate all entries have required fields
    const requiredFields = ["employeeId", "period", "baseSalary"];
    for (let i = 0; i < payrolls.length; i++) {
      const payroll = payrolls[i];
      for (const field of requiredFields) {
        if (!payroll[field]) {
          return NextResponse.json(
            { error: `Entry ${i + 1}: ${field} is required` },
            { status: 400 }
          );
        }
      }
    }

    // Validate all employees belong to the organization
    const employeeIds = payrolls.map((p: any) => p.employeeId);
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        id: { in: employeeIds },
        organizationId
      },
      include: { user: { select: { id: true, name: true } } }
    });

    if (teamMembers.length !== employeeIds.length) {
      const validIds = teamMembers.map((t) => t.id);
      const invalidId = employeeIds.find((id: string) => !validIds.includes(id));
      return NextResponse.json(
        { error: `Invalid employee ID: ${invalidId}` },
        { status: 400 }
      );
    }

    // Create payroll entries
    const createdPayrolls = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const payrollInput of payrolls) {
        const base = parseFloat(payrollInput.baseSalary);
        const ot = parseFloat(payrollInput.overtime) || 0;
        const ni = parseFloat(payrollInput.niContribution) || 0;
        const pen = parseFloat(payrollInput.pension) || 0;
        const labour = base + ot;
        const rate = payrollInput.cisRate ?? cisRate ?? 20;
        const cis = Math.round(labour * (rate / 100) * 100) / 100;
        const net = Math.round((base + ot - cis - ni - pen) * 100) / 100;

        const payroll = await tx.payroll.create({
          data: {
            employeeId: payrollInput.employeeId,
            period: payrollInput.period,
            baseSalary: base,
            overtime: ot,
            cisDeduction: cis,
            niContribution: ni,
            pension: pen,
            netPay: net,
            status: (payrollInput.status as any) || "DRAFT",
            notes: payrollInput.notes?.trim() || null,
            organizationId
          },
          include: {
            employee: {
              include: {
                user: { select: { id: true, name: true, role: true } }
              }
            }
          }
        });

        results.push(payroll);

        // Log activity
        await tx.activityLog.create({
          data: {
            action: "created payroll entry (bulk)",
            entityType: "Payroll",
            entityId: payroll.id,
            entityName: `Payroll for ${payroll.employee.user.name} - ${payroll.period}`,
            userId: session.user.id,
            details: `Net pay: £${payroll.netPay}`
          }
        });
      }
      return results;
    });

    // Broadcast to organization
    broadcastToOrganization(organizationId, {
      type: "payroll_bulk_created",
      payload: {
        count: createdPayrolls.length,
        payrolls: createdPayrolls.map((p) => ({
          payrollId: p.id,
          employeeName: p.employee.user.name,
          period: p.period,
          netPay: p.netPay
        })),
        createdBy: session.user.id
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(bigintSafe(createdPayrolls), { status: 201 });
  } catch (error) {
    console.error("Error creating bulk payrolls:", error);
    return NextResponse.json({ error: "Failed to create bulk payrolls" }, { status: 500 });
  }
}
