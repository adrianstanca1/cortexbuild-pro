import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    // Only allow managers and admins to export payroll
    if (!["ADMIN", "COMPANY_OWNER", "COMPANY_ADMIN", "SUPER_ADMIN"].includes(user.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get("format") || "csv";
    const period = searchParams.get("period");
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");
    const limit = parseInt(searchParams.get("limit") || "1000");

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId: user.organizationId
    };

    if (period) {
      where.period = period;
    }

    if (status) {
      where.status = status;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: { period: "desc" },
      take: limit,
    });

    if (formatType === "xlsx") {
      return generatePayrollExcel(payrolls);
    }

    return generatePayrollCSV(payrolls);
  } catch (error) {
    console.error("Payroll export error:", error);
    return NextResponse.json({ error: "Failed to export payroll" }, { status: 500 });
  }
}

function generatePayrollCSV(payrolls: any[]) {
  const headers = [
    "Employee",
    "Email",
    "Period",
    "Status",
    "Base Salary",
    "Overtime",
    "Gross Pay",
    "CIS Rate",
    "CIS Deduction",
    "NI Contribution",
    "Pension",
    "Total Deductions",
    "Net Pay",
    "Notes"
  ];

  const rows = payrolls.map(p => {
    const grossPay = (p.baseSalary || 0) + (p.overtime || 0);
    const totalDeductions = (p.cisDeduction || 0) + (p.niContribution || 0) + (p.pension || 0);
    const cisRate = grossPay > 0 ? Math.round(((p.cisDeduction || 0) / grossPay) * 100) : 0;

    return [
      p.employee?.user?.name || "",
      p.employee?.user?.email || "",
      p.period || "",
      p.status,
      p.baseSalary || 0,
      p.overtime || 0,
      grossPay,
      `${cisRate}%`,
      p.cisDeduction || 0,
      p.niContribution || 0,
      p.pension || 0,
      totalDeductions,
      p.netPay || 0,
      p.notes || ""
    ];
  });

  const csvContent = generateCSV(headers, rows);
  const timestamp = format(new Date(), "yyyy-MM-dd");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payroll-report-${timestamp}.csv"`
    }
  });
}

function generatePayrollExcel(payrolls: any[]) {
  // Generate Excel XML format (SpreadsheetML)
  // This is a simplified Excel 2003 XML format that Excel can open
  const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="header"><Font ss:Bold="1" ss:Size="12"/><Interior ss:Color="#1E40AF" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF"/></Style>
    <Style ss:ID="currency"><NumberFormat ss:Format="£#,##0.00"/></Style>
    <Style ss:ID="date"><NumberFormat ss:Format="yyyy-mm-dd"/></Style>
  </Styles>
  <Worksheet ss:Name="Payroll Report">
    <Table>
      <Column ss:Width="120"/>
      <Column ss:Width="180"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      <Column ss:Width="60"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      <Column ss:Width="200"/>
      <Row>
        <Cell ss:StyleID="header"><Data ss:Type="String">Employee</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Email</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Period</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Status</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Base Salary</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Overtime</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Gross Pay</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">CIS Rate</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">CIS Deduction</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">NI Contribution</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Pension</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Total Deductions</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Net Pay</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Notes</Data></Cell>
      </Row>
      ${payrolls.map(p => {
        const grossPay = (p.baseSalary || 0) + (p.overtime || 0);
        const totalDeductions = (p.cisDeduction || 0) + (p.niContribution || 0) + (p.pension || 0);
        const cisRate = grossPay > 0 ? Math.round(((p.cisDeduction || 0) / grossPay) * 100) : 0;
        return `
      <Row>
        <Cell><Data ss:Type="String">${escapeXml(p.employee?.user?.name || "")}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.employee?.user?.email || "")}</Data></Cell>
        <Cell><Data ss:Type="String">${p.period || ""}</Data></Cell>
        <Cell><Data ss:Type="String">${p.status}</Data></Cell>
        <Cell ss:StyleID="currency"><Data ss:Type="Number">${p.baseSalary || 0}</Data></Cell>
        <Cell ss:StyleID="currency"><Data ss:Type="Number">${p.overtime || 0}</Data></Cell>
        <Cell ss:StyleID="currency"><Data ss:Type="Number">${grossPay}</Data></Cell>
        <Cell><Data ss:Type="String">${cisRate}%</Data></Cell>
        <Cell ss:StyleID="currency"><Data ss:Type="Number">${p.cisDeduction || 0}</Data></Cell>
        <Cell ss:StyleID="currency"><Data ss:Type="Number">${p.niContribution || 0}</Data></Cell>
        <Cell ss:StyleID="currency"><Data ss:Type="Number">${p.pension || 0}</Data></Cell>
        <Cell ss:StyleID="currency"><Data ss:Type="Number">${totalDeductions}</Data></Cell>
        <Cell ss:StyleID="currency"><Data ss:Type="Number">${p.netPay || 0}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.notes || "")}</Data></Cell>
      </Row>`;
      }).join("")}
    </Table>
  </Worksheet>
</Workbook>`;

  const timestamp = format(new Date(), "yyyy-MM-dd");

  return new NextResponse(xmlContent, {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": `attachment; filename="payroll-report-${timestamp}.xls"`
    }
  });
}

function generateCSV(headers: string[], rows: any[][]): string {
  const escape = (val: any) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escape).join(",");
  const dataRows = rows.map(row => row.map(escape).join(","));
  return [headerRow, ...dataRows].join("\n");
}

function escapeXml(str: string): string {
  return str.replace(/[&<>"']/g, (match) => {
    const escapeMap: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;"
    };
    return escapeMap[match];
  });
}
