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

    const user = session.user as { id: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get("format") || "csv";
    const projectId = searchParams.get("projectId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "1000");

    // Build where clause
    const where: Record<string, unknown> = {
      project: { organizationId: user.organizationId }
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) {
        (where.reportDate as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.reportDate as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const dayworks = await prisma.dailyReport.findMany({
      where,
      include: {
        project: { select: { name: true } },
        createdBy: { select: { name: true } },
        materialEntries: true,
        equipmentEntries: true,
        laborEntries: true,
      },
      orderBy: { reportDate: "desc" },
      take: limit,
    });

    if (formatType === "pdf") {
      // Generate PDF for a single daywork if reportId provided
      const reportId = searchParams.get("reportId");
      if (reportId) {
        const report = dayworks.find(d => d.id === reportId);
        if (report) {
          return generateDailyReportPDF(report);
        }
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      // Otherwise return CSV
      return generateDayworksCSV(dayworks);
    }

    return generateDayworksCSV(dayworks);
  } catch (error) {
    console.error("Dayworks export error:", error);
    return NextResponse.json({ error: "Failed to export dayworks" }, { status: 500 });
  }
}

function generateDayworksCSV(dayworks: any[]) {
  const headers = [
    "Date",
    "Project",
    "Weather",
    "Crew Size",
    "Work Description",
    "Materials",
    "Equipment",
    "Labor Trades",
    "Created By"
  ];

  const rows = dayworks.map(d => {
    const materials = d.materialEntries.map((m: any) => `${m.materialName}: ${m.quantityUsed} ${m.unit}`).join("; ");
    const equipment = d.equipmentEntries.map((e: any) => `${e.equipmentName}: ${e.hoursUsed} hrs`).join("; ");
    const labor = d.laborEntries.map((l: any) => `${l.trade || "N/A"} (${l.headcount} workers)`).join("; ");

    return [
      format(d.reportDate, "yyyy-MM-dd"),
      d.project.name,
      d.weather.toString().toLowerCase().replace("_", " "),
      d.manpowerCount || 0,
      d.workPerformed || "",
      materials,
      equipment,
      labor,
      d.createdBy?.name || ""
    ];
  });

  const csvContent = generateCSV(headers, rows);
  const timestamp = format(new Date(), "yyyy-MM-dd");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="dayworks-report-${timestamp}.csv"`
    }
  });
}

function generateDailyReportPDF(report: any) {
  // Generate HTML-based PDF content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #1e40af; margin-bottom: 10px; }
        h2 { color: #374151; font-size: 18px; margin-top: 20px; }
        .header { border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .info-item { background: #f3f4f6; padding: 12px; border-radius: 6px; }
        .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .info-value { font-weight: 600; color: #1f2937; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #1e40af; color: white; padding: 10px; text-align: left; font-size: 13px; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        .section { margin-top: 25px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Daily Work Report</h1>
        <p style="color: #6b7280;">Report Date: ${format(report.reportDate, "MMMM d, yyyy")}</p>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Project</div>
          <div class="info-value">${report.project.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Weather</div>
          <div class="info-value">${report.weather.toString().replace("_", " ")}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Crew Size</div>
          <div class="info-value">${report.manpowerCount || 0} workers</div>
        </div>
        <div class="info-item">
          <div class="info-label">Reported By</div>
          <div class="info-value">${report.createdBy?.name || "Unknown"}</div>
        </div>
      </div>

      <div class="section">
        <h2>Work Description</h2>
        <p style="line-height: 1.6;">${report.workPerformed || "No description provided"}</p>
      </div>

      ${report.materialEntries?.length ? `
        <div class="section">
          <h2>Materials Used</h2>
          <table>
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Quantity</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              ${report.materialEntries.map((m: any) => `
                <tr>
                  <td>${m.materialName || "N/A"}</td>
                  <td>${m.quantityUsed || 0}</td>
                  <td>${m.unit || "each"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : ""}

      ${report.equipmentEntries?.length ? `
        <div class="section">
          <h2>Equipment Used</h2>
          <table>
            <thead>
              <tr>
                <th>Equipment Name</th>
                <th>Hours Used</th>
              </tr>
            </thead>
            <tbody>
              ${report.equipmentEntries.map((e: any) => `
                <tr>
                  <td>${e.equipmentName || "N/A"}</td>
                  <td>${e.hoursUsed || 0} hrs</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : ""}

      ${report.laborEntries?.length ? `
        <div class="section">
          <h2>Labor Entries</h2>
          <table>
            <thead>
              <tr>
                <th>Trade</th>
                <th>Company</th>
                <th>Headcount</th>
                <th>Regular Hours</th>
                <th>OT Hours</th>
              </tr>
            </thead>
            <tbody>
              ${report.laborEntries.map((l: any) => `
                <tr>
                  <td>${l.trade || "N/A"}</td>
                  <td>${l.company || "N/A"}</td>
                  <td>${l.headcount || 0}</td>
                  <td>${l.regularHours || 0}</td>
                  <td>${l.overtimeHours || 0}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : ""}

      <div class="footer">
        <p>Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")} | Daily Report ID: ${report.id}</p>
      </div>
    </body>
    </html>
  `;

  // Return as HTML with PDF content type header
  // Note: For actual PDF generation, you'd use a library like pdfmake or puppeteer
  // This returns HTML that can be printed to PDF via browser's print dialog
  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="daily-report-${report.id}.html"`
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
