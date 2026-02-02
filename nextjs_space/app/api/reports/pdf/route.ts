import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reportType, projectId, dateRange } = body;

    // Fetch data based on report type
    let reportData: any = {};
    const orgId = session.user.organizationId ?? "";

    if (reportType === "project_summary" && projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: orgId },
        include: {
          tasks: true,
          manager: { select: { name: true } },
          costItems: true,
          milestones: true
        }
      });
      reportData = { project };
    } else if (reportType === "budget_report") {
      const costItems = await prisma.costItem.findMany({
        where: { project: { organizationId: orgId } },
        include: { project: { select: { name: true } } }
      });
      reportData = { costItems };
    } else if (reportType === "time_entries") {
      const timeEntries = await prisma.timeEntry.findMany({
        where: { project: { organizationId: orgId } },
        include: {
          project: { select: { name: true } },
          user: { select: { name: true } },
          task: { select: { title: true } }
        },
        orderBy: { date: "desc" },
        take: 100
      });
      reportData = { timeEntries };
    } else {
      // General overview
      const [projects, tasks, milestones] = await Promise.all([
        prisma.project.findMany({
          where: { organizationId: orgId },
          include: { _count: { select: { tasks: true } } }
        }),
        prisma.task.findMany({
          where: { project: { organizationId: orgId } }
        }),
        prisma.milestone.findMany({
          where: { project: { organizationId: orgId } }
        })
      ]);
      reportData = { projects, tasks, milestones };
    }

    // Generate HTML content for PDF
    const htmlContent = generateReportHTML(reportType, reportData, session.user.name ?? "User");

    // Call HTML2PDF API
    const createResponse = await fetch("https://apps.abacus.ai/api/createConvertHtmlToPdfRequest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: htmlContent,
        pdf_options: {
          format: "A4",
          margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
          print_background: true
        }
      })
    });

    if (!createResponse.ok) {
      throw new Error("Failed to create PDF request");
    }

    const { request_id } = await createResponse.json();

    // Poll for completion
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch("https://apps.abacus.ai/api/getConvertHtmlToPdfStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id,
          deployment_token: process.env.ABACUSAI_API_KEY
        })
      });

      const statusResult = await statusResponse.json();

      if (statusResult?.status === "SUCCESS" && statusResult?.result?.result) {
        const pdfBuffer = Buffer.from(statusResult.result.result, "base64");
        return new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="report-${format(new Date(), "yyyy-MM-dd")}.pdf"`
          }
        });
      } else if (statusResult?.status === "FAILED") {
        throw new Error("PDF generation failed");
      }

      attempts++;
    }

    throw new Error("PDF generation timed out");
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

function generateReportHTML(reportType: string, data: any, userName: string): string {
  const date = format(new Date(), "MMMM d, yyyy");
  const styles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Helvetica', Arial, sans-serif; color: #1a1a2e; line-height: 1.6; }
      .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; }
      .header h1 { font-size: 28px; margin-bottom: 5px; }
      .header p { opacity: 0.8; }
      .content { padding: 30px; }
      .section { margin-bottom: 30px; }
      .section-title { font-size: 18px; font-weight: bold; color: #1a1a2e; border-bottom: 2px solid #0f4c75; padding-bottom: 10px; margin-bottom: 15px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
      th { background: #f8f9fa; font-weight: 600; color: #1a1a2e; }
      .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
      .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
      .stat-value { font-size: 32px; font-weight: bold; color: #0f4c75; }
      .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
      .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
      .badge-success { background: #d4edda; color: #155724; }
      .badge-warning { background: #fff3cd; color: #856404; }
      .badge-info { background: #cce5ff; color: #004085; }
      .badge-danger { background: #f8d7da; color: #721c24; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
  `;

  let content = "";

  if (reportType === "project_summary" && data.project) {
    const p = data.project;
    const completedTasks = p.tasks?.filter((t: any) => t.status === "COMPLETE").length || 0;
    const totalTasks = p.tasks?.length || 0;
    const totalBudget = p.costItems?.reduce((sum: number, c: any) => sum + (c.estimatedAmount || 0), 0) || 0;
    const actualSpend = p.costItems?.reduce((sum: number, c: any) => sum + (c.actualAmount || 0), 0) || 0;

    content = `
      <div class="section">
        <h2 class="section-title">Project Overview</h2>
        <p><strong>Project:</strong> ${p.name}</p>
        <p><strong>Status:</strong> ${p.status}</p>
        <p><strong>Manager:</strong> ${p.manager?.name || "Unassigned"}</p>
        <p><strong>Location:</strong> ${p.location || "N/A"}</p>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${totalTasks}</div><div class="stat-label">Total Tasks</div></div>
        <div class="stat-card"><div class="stat-value">${completedTasks}</div><div class="stat-label">Completed</div></div>
        <div class="stat-card"><div class="stat-value">£${totalBudget.toLocaleString()}</div><div class="stat-label">Budget</div></div>
        <div class="stat-card"><div class="stat-value">£${actualSpend.toLocaleString()}</div><div class="stat-label">Spent</div></div>
      </div>
      <div class="section">
        <h2 class="section-title">Tasks</h2>
        <table>
          <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Due Date</th></tr></thead>
          <tbody>
            ${(p.tasks || []).slice(0, 20).map((t: any) => `
              <tr>
                <td>${t.title}</td>
                <td><span class="badge badge-${t.status === 'COMPLETE' ? 'success' : t.status === 'IN_PROGRESS' ? 'info' : 'warning'}">${t.status}</span></td>
                <td>${t.priority}</td>
                <td>${t.dueDate ? format(new Date(t.dueDate), "MMM d, yyyy") : "N/A"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } else if (reportType === "budget_report") {
    const items = data.costItems || [];
    const total = items.reduce((sum: number, c: any) => sum + (c.actualAmount || 0), 0);

    content = `
      <div class="section">
        <h2 class="section-title">Budget Summary</h2>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-value">${items.length}</div><div class="stat-label">Cost Items</div></div>
          <div class="stat-card"><div class="stat-value">£${total.toLocaleString()}</div><div class="stat-label">Total Spend</div></div>
        </div>
        <table>
          <thead><tr><th>Description</th><th>Project</th><th>Category</th><th>Estimated</th><th>Actual</th></tr></thead>
          <tbody>
            ${items.slice(0, 30).map((c: any) => `
              <tr>
                <td>${c.description}</td>
                <td>${c.project?.name || "N/A"}</td>
                <td>${c.category}</td>
                <td>£${(c.estimatedAmount || 0).toLocaleString()}</td>
                <td>£${(c.actualAmount || 0).toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } else if (reportType === "time_entries") {
    const entries = data.timeEntries || [];
    const totalHours = entries.reduce((sum: number, e: any) => sum + (e.hours || 0), 0);

    content = `
      <div class="section">
        <h2 class="section-title">Time Tracking Report</h2>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-value">${entries.length}</div><div class="stat-label">Entries</div></div>
          <div class="stat-card"><div class="stat-value">${totalHours.toFixed(1)}h</div><div class="stat-label">Total Hours</div></div>
        </div>
        <table>
          <thead><tr><th>Date</th><th>User</th><th>Project</th><th>Task</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            ${entries.slice(0, 50).map((e: any) => `
              <tr>
                <td>${format(new Date(e.date), "MMM d, yyyy")}</td>
                <td>${e.user?.name || "N/A"}</td>
                <td>${e.project?.name || "N/A"}</td>
                <td>${e.task?.title || "-"}</td>
                <td>${e.hours}h</td>
                <td><span class="badge badge-${e.status === 'APPROVED' ? 'success' : e.status === 'REJECTED' ? 'danger' : 'warning'}">${e.status}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } else {
    // General overview
    const { projects = [], tasks = [], milestones = [] } = data;
    const activeProjects = projects.filter((p: any) => p.status === "IN_PROGRESS").length;
    const completedTasks = tasks.filter((t: any) => t.status === "COMPLETE").length;

    content = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${projects.length}</div><div class="stat-label">Projects</div></div>
        <div class="stat-card"><div class="stat-value">${activeProjects}</div><div class="stat-label">Active</div></div>
        <div class="stat-card"><div class="stat-value">${tasks.length}</div><div class="stat-label">Tasks</div></div>
        <div class="stat-card"><div class="stat-value">${completedTasks}</div><div class="stat-label">Completed</div></div>
      </div>
      <div class="section">
        <h2 class="section-title">Projects</h2>
        <table>
          <thead><tr><th>Name</th><th>Status</th><th>Tasks</th></tr></thead>
          <tbody>
            ${projects.slice(0, 20).map((p: any) => `
              <tr>
                <td>${p.name}</td>
                <td><span class="badge badge-${p.status === 'COMPLETED' ? 'success' : p.status === 'IN_PROGRESS' ? 'info' : 'warning'}">${p.status}</span></td>
                <td>${p._count?.tasks || 0}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1>CortexBuild Pro Report</h1>
        <p>Generated on ${date} by ${userName}</p>
      </div>
      <div class="content">
        ${content}
        <div class="footer">
          <p>This report was automatically generated by CortexBuild Pro. For questions, contact your administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
