import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get("format") || "pdf";

    // Fetch the RAMS record
    const rams = await prisma.riskAssessment.findUnique({
      where: { id },
      include: {
        project: { select: { name: true } },
        createdBy: { select: { name: true } }
      }
    });

    if (!rams) {
      return NextResponse.json({ error: "RAMS not found" }, { status: 404 });
    }

    // Verify the RAMS belongs to user's organization
    const projectCheck = await prisma.project.findUnique({
      where: { id: rams.projectId },
      select: { organizationId: true }
    });

    if (!projectCheck || projectCheck.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (formatType === "pdf") {
      return generateRamsPDF(rams);
    }

    return generateRamsHTML(rams);
  } catch (error) {
    console.error("RAMS export error:", error);
    return NextResponse.json({ error: "Failed to export RAMS" }, { status: 500 });
  }
}

function generateRamsPDF(rams: any) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #1e40af; margin-bottom: 5px; font-size: 24px; }
        h2 { color: #374151; font-size: 16px; margin-top: 24px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
        .header { border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
        .subtitle { color: #6b7280; font-size: 14px; margin-top: 8px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px; font-size: 13px; }
        .meta-item { background: #f3f4f6; padding: 10px 12px; border-radius: 6px; }
        .meta-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
        .meta-value { font-weight: 500; color: #1f2937; margin-top: 3px; }
        .risk-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 13px; }
        .risk-extreme { background: #dc2626; color: white; }
        .risk-high { background: #ea580c; color: white; }
        .risk-medium { background: #eab308; color: black; }
        .risk-low { background: #22c55e; color: white; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 6px 0; line-height: 1.5; font-size: 13px; }
        .content-section { margin-top: 20px; background: #f9fafb; padding: 16px; border-radius: 8px; }
        .content-section p { line-height: 1.7; font-size: 13px; color: #374151; }
        .ppe-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .ppe-tag { background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .emergency-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; margin-top: 10px; font-size: 13px; line-height: 1.6; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 11px; color: #6b7280; display: flex; justify-content: space-between; }
        .watermark { opacity: 0.1; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: #1e40af; pointer-events: none; }
        @media print { body { padding: 20px; } .watermark { position: absolute; } }
      </style>
    </head>
    <body>
      <div class="watermark">RAMS</div>

      <div class="header">
        <h1>Risk Assessment Method Statement</h1>
        <p class="subtitle">RAMS Document</p>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Project</div>
          <div class="meta-value">${rams.project?.name || "N/A"}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Activity</div>
          <div class="meta-value">${rams.title || "N/A"}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Risk Level</div>
          <div class="meta-value">
            <span class="risk-badge risk-${rams.riskLevel?.toLowerCase() || "medium"}">${rams.riskLevel || "MEDIUM"}</span>
          </div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Residual Risk</div>
          <div class="meta-value">
            <span class="risk-badge risk-${rams.residualRisk?.toLowerCase() || "low"}">${rams.residualRisk || "LOW"}</span>
          </div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Created By</div>
          <div class="meta-value">${rams.createdBy?.name || "Unknown"}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Date Created</div>
          <div class="meta-value">${format(rams.createdAt, "MMMM d, yyyy")}</div>
        </div>
      </div>

      <h2>Identified Hazards</h2>
      <div class="content-section">
        <ul>
          ${(rams.hazards || []).map((h: string) => `<li>${h}</li>`).join("")}
        </ul>
      </div>

      <h2>Control Measures</h2>
      <div class="content-section">
        <ul>
          ${(rams.controlMeasures || []).map((c: string) => `<li>${c}</li>`).join("")}
        </ul>
      </div>

      <h2>Method Statement</h2>
      <div class="content-section">
        <p>${rams.description || rams.hazards?.[0] || "No method statement provided."}</p>
      </div>

      <h2>Required PPE</h2>
      <div class="content-section">
        <div class="ppe-tags">
          ${(rams.ppeRequired || []).map((p: string) => `<span class="ppe-tag">${p}</span>`).join("")}
        </div>
      </div>

      <h2>Emergency Procedures</h2>
      <div class="content-section">
        <div class="emergency-box">
          ${rams.emergencyProcedures || "Follow site emergency procedures. Contact emergency services if needed."}
        </div>
      </div>

      <div class="footer">
        <span>Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</span>
        <span>RAMS ID: ${rams.id}</span>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="RAMS-${rams.id}.html"`
    }
  });
}

function generateRamsHTML(rams: any) {
  return generateRamsPDF(rams);
}
