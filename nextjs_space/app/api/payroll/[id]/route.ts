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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const payroll = await prisma.payroll.findUnique({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          }
        }
      }
    });

    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    return NextResponse.json(bigintSafe(payroll));
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json({ error: "Failed to fetch payroll" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    const {
      baseSalary,
      overtime,
      cisDeduction,
      niContribution,
      pension,
      status,
      notes
    } = body;

    // Fetch existing payroll to validate ownership and get current values
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id, organizationId },
      include: {
        employee: { include: { user: { select: { id: true, name: true } } } }
      }
    });

    if (!existingPayroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    // Status workflow validation: draft -> processed -> paid
    const statusWorkflow = ["DRAFT", "PROCESSED", "PAID"];
    if (status && !statusWorkflow.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Prevent invalid status transitions
    if (status) {
      const currentIndex = statusWorkflow.indexOf(existingPayroll.status);
      const newIndex = statusWorkflow.includes(status) ? statusWorkflow.indexOf(status) : -1;
      if (newIndex !== -1 && newIndex < currentIndex) {
        return NextResponse.json({ error: "Cannot revert status" }, { status: 400 });
      }
    }

    // Calculate values if salary fields are provided
    let updateData: any = {};
    if (baseSalary !== undefined || overtime !== undefined) {
      const base = parseFloat(baseSalary ?? existingPayroll.baseSalary);
      const ot = parseFloat(overtime ?? existingPayroll.overtime);
      const ni = parseFloat(body.niContribution ?? existingPayroll.niContribution);
      const pen = parseFloat(body.pension ?? existingPayroll.pension);
      const labour = base + ot;
      const cisRate = body.cisRate ?? 20;
      const cis = Math.round(labour * (cisRate / 100) * 100) / 100;
      const net = Math.round((base + ot - cis - ni - pen) * 100) / 100;

      updateData.baseSalary = base;
      updateData.overtime = ot;
      updateData.cisDeduction = cis;
      updateData.niContribution = ni;
      updateData.pension = pen;
      updateData.netPay = net;
    }

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const payroll = await prisma.payroll.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "updated payroll entry",
        entityType: "Payroll",
        entityId: payroll.id,
        entityName: `Payroll for ${existingPayroll.employee.user.name} - ${payroll.period}`,
        userId: session.user.id,
        details: `Status: ${existingPayroll.status} -> ${payroll.status}, Net pay: £${payroll.netPay}`
      }
    });

    // Broadcast to organization
    broadcastToOrganization(organizationId, {
      type: "payroll_updated",
      payload: {
        payrollId: payroll.id,
        employeeName: existingPayroll.employee.user.name,
        period: payroll.period,
        netPay: payroll.netPay,
        status: payroll.status,
        updatedBy: session.user.id
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(bigintSafe(payroll));
  } catch (error) {
    console.error("Error updating payroll:", error);
    return NextResponse.json({ error: "Failed to update payroll" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    // Fetch payroll before deletion for logging and broadcast
    const payroll = await prisma.payroll.findUnique({
      where: { id, organizationId },
      include: {
        employee: { include: { user: { select: { id: true, name: true } } } }
      }
    });

    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    // Prevent deletion of paid payroll entries
    if (payroll.status === "PAID") {
      return NextResponse.json({ error: "Cannot delete paid payroll entries" }, { status: 400 });
    }

    await prisma.payroll.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "deleted payroll entry",
        entityType: "Payroll",
        entityId: id,
        entityName: `Payroll for ${payroll.employee.user.name} - ${payroll.period}`,
        userId: session.user.id,
        details: `Status: ${payroll.status}, Net pay: £${payroll.netPay}`
      }
    });

    // Broadcast to organization
    broadcastToOrganization(organizationId, {
      type: "payroll_deleted",
      payload: {
        payrollId: id,
        employeeName: payroll.employee.user.name,
        period: payroll.period,
        deletedBy: session.user.id
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ message: "Payroll deleted successfully" });
  } catch (error) {
    console.error("Error deleting payroll:", error);
    return NextResponse.json({ error: "Failed to delete payroll" }, { status: 500 });
  }
}
