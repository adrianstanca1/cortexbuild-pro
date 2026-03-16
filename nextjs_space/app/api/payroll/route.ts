export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    // Only allow managers and admins to access payroll
    if (!["ADMIN", "COMPANY_OWNER", "COMPANY_ADMIN", "SUPER_ADMIN"].includes(userRole as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    const payrolls = await prisma.payroll.findMany({
      where: {
        organizationId,
        ...(period && { period }),
        ...(status && { status: status as any }),
        ...(employeeId && { employeeId })
      },
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

    return NextResponse.json(payrolls);
  } catch (error) {
    console.error("Error fetching payrolls:", error);
    return NextResponse.json({ error: "Failed to fetch payrolls" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    // Only allow managers and admins to create payroll
    if (!["ADMIN", "COMPANY_OWNER", "COMPANY_ADMIN", "SUPER_ADMIN"].includes(userRole as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const body = await request.json();
    const {
      employeeId,
      period,
      baseSalary,
      overtime,
      cisDeduction,
      niContribution,
      pension,
      netPay,
      status,
      notes
    } = body;

    if (!employeeId || !period || baseSalary === undefined) {
      return NextResponse.json({ error: "Employee, period, and base salary are required" }, { status: 400 });
    }

    // Validate that the employee belongs to the organization
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: employeeId },
      include: { user: { select: { id: true, name: true } } }
    });

    if (!teamMember || teamMember.organizationId !== organizationId) {
      return NextResponse.json({ error: "Invalid employee" }, { status: 400 });
    }

    // Calculate values if not provided
    const base = parseFloat(baseSalary);
    const ot = parseFloat(overtime) || 0;
    const ni = parseFloat(niContribution) || 0;
    const pen = parseFloat(pension) || 0;
    const labour = base + ot;
    const cisRate = body.cisRate || 20;
    const cis = Math.round(labour * (cisRate / 100) * 100) / 100;
    const net = Math.round((base + ot - cis - ni - pen) * 100) / 100;

    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        period,
        baseSalary: base,
        overtime: ot,
        cisDeduction: cis,
        niContribution: ni,
        pension: pen,
        netPay: net,
        status: (status as any) || "DRAFT",
        notes: notes?.trim() || null,
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "created payroll entry",
        entityType: "Payroll",
        entityId: payroll.id,
        entityName: `Payroll for ${teamMember.user.name} - ${period}`,
        userId: session.user.id,
        details: `Net pay: £${netPay}`
      }
    });

    // Create comprehensive audit log
    await createAuditLog(prisma, {
      userId: session.user.id,
      organizationId,
      userRole: userRole as string,
      userName: session.user.name || '',
      userEmail: session.user.email || '',
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    }, {
      entity: "Payroll",
      entityId: payroll.id,
      action: "CREATE",
      newValues: {
        employeeId: payroll.employeeId,
        period: payroll.period,
        baseSalary: payroll.baseSalary,
        overtime: payroll.overtime,
        cisDeduction: payroll.cisDeduction,
        niContribution: payroll.niContribution,
        pension: payroll.pension,
        netPay: payroll.netPay,
        status: payroll.status,
      },
      metadata: {
        employeeName: teamMember.user.name,
      },
    });

    // Broadcast to organization
    broadcastToOrganization(organizationId, {
      type: "payroll_created",
      payload: {
        payrollId: payroll.id,
        employeeName: teamMember.user.name,
        period,
        netPay: payroll.netPay,
        createdBy: session.user.id
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(payroll, { status: 201 });
  } catch (error) {
    console.error("Error creating payroll:", error);
    return NextResponse.json({ error: "Failed to create payroll" }, { status: 500 });
  }
}
