import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const toolCheck = await prisma.toolCheck.findUnique({
      where: { id: id },
      include: {
        project: { select: { name: true, organizationId: true } },
        inspector: { select: { name: true, email: true } },
      },
    });

    if (!toolCheck) {
      return NextResponse.json(
        { error: "Tool check not found" },
        { status: 404 },
      );
    }

    const orgId = (session.user as any).organizationId;
    if (toolCheck.project.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const htmlContent = generateToolCheckPDF(toolCheck);

    // Create PDF request
    const createResponse = await fetch(
      "https://apps.abacus.ai/api/createConvertHtmlToPdfRequest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          html_content: htmlContent,
          pdf_options: { format: "A4", print_background: true },
          base_url: process.env.NEXTAUTH_URL || "",
        }),
      },
    );

    if (!createResponse.ok) {
      return NextResponse.json(
        { error: "Failed to create PDF request" },
        { status: 500 },
      );
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json(
        { error: "No request ID returned" },
        { status: 500 },
      );
    }

    // Poll for status
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        "https://apps.abacus.ai/api/getConvertHtmlToPdfStatus",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_id,
            deployment_token: process.env.ABACUSAI_API_KEY,
          }),
        },
      );

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || "FAILED";
      const result = statusResult?.result || null;

      if (status === "SUCCESS" && result?.result) {
        const pdfBuffer = Buffer.from(result.result, "base64");
        const pdfArray = new Uint8Array(pdfBuffer);
        const filename = `tool-check-${toolCheck.toolName?.replace(/[^a-zA-Z0-9]/g, "-") || "tool"}-${format(new Date(toolCheck.checkDate), "yyyy-MM-dd")}.pdf`;

        return new NextResponse(pdfArray, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      } else if (status === "FAILED") {
        return NextResponse.json(
          { error: "PDF generation failed" },
          { status: 500 },
        );
      }
      attempts++;
    }

    return NextResponse.json(
      { error: "PDF generation timed out" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function generateToolCheckPDF(check: any) {
  const toolTypeLabels: Record<string, string> = {
    POWER_TOOL: "Power Tool",
    HAND_TOOL: "Hand Tool",
    LADDER: "Ladder",
    SCAFFOLD: "Scaffold",
    OTHER: "Other Equipment",
  };

  const getCheckItems = () => {
    const items: { name: string; value: string }[] = [];

    // Common items
    if (check.visualCondition !== undefined)
      items.push({ name: "Visual Condition", value: check.visualCondition });
    if (check.cleanAndFree !== undefined)
      items.push({ name: "Clean & Free of Debris", value: check.cleanAndFree });
    if (check.properStorage !== undefined)
      items.push({ name: "Proper Storage", value: check.properStorage });

    // Power tool specific
    if (check.guardsIntact !== undefined)
      items.push({ name: "Guards Intact", value: check.guardsIntact });
    if (check.cordCondition !== undefined)
      items.push({ name: "Cord Condition", value: check.cordCondition });
    if (check.switchFunction !== undefined)
      items.push({ name: "Switch Function", value: check.switchFunction });
    if (check.properGrounding !== undefined)
      items.push({ name: "Proper Grounding", value: check.properGrounding });
    if (check.ventilationClear !== undefined)
      items.push({ name: "Ventilation Clear", value: check.ventilationClear });
    if (check.batteryCondition !== undefined)
      items.push({ name: "Battery Condition", value: check.batteryCondition });

    // Hand tool specific
    if (check.handlesSecure !== undefined)
      items.push({ name: "Handles Secure", value: check.handlesSecure });
    if (check.cuttingEdgesSharp !== undefined)
      items.push({
        name: "Cutting Edges Sharp",
        value: check.cuttingEdgesSharp,
      });
    if (check.noRustCorrosion !== undefined)
      items.push({ name: "No Rust/Corrosion", value: check.noRustCorrosion });
    if (check.properSize !== undefined)
      items.push({ name: "Proper Size for Job", value: check.properSize });

    // Ladder specific
    if (check.rungsIntact !== undefined)
      items.push({ name: "Rungs Intact", value: check.rungsIntact });
    if (check.feetCondition !== undefined)
      items.push({ name: "Feet Condition", value: check.feetCondition });
    if (check.lockingMechanismOk !== undefined)
      items.push({
        name: "Locking Mechanism OK",
        value: check.lockingMechanismOk,
      });
    if (check.weightCapacityVisible !== undefined)
      items.push({
        name: "Weight Capacity Visible",
        value: check.weightCapacityVisible,
      });
    if (check.noLooseHardware !== undefined)
      items.push({ name: "No Loose Hardware", value: check.noLooseHardware });

    // Scaffold specific
    if (check.platformsSecure !== undefined)
      items.push({ name: "Platforms Secure", value: check.platformsSecure });
    if (check.guardrailsInPlace !== undefined)
      items.push({
        name: "Guardrails in Place",
        value: check.guardrailsInPlace,
      });
    if (check.bracingIntact !== undefined)
      items.push({ name: "Cross-Bracing Intact", value: check.bracingIntact });
    if (check.basePlatesLevel !== undefined)
      items.push({ name: "Base Plates Level", value: check.basePlatesLevel });
    if (check.accessLaddersSecure !== undefined)
      items.push({
        name: "Access Ladders Secure",
        value: check.accessLaddersSecure,
      });

    return items;
  };

  const checkItems = getCheckItems();

  const getStatusStyle = (value: string) => {
    switch (value) {
      case "OK":
        return "background: #dcfce7; color: #166534;";
      case "DEFECTIVE":
        return "background: #fef2f2; color: #dc2626;";
      case "NEEDS_REPAIR":
        return "background: #fef3c7; color: #92400e;";
      default:
        return "background: #f3f4f6; color: #6b7280;";
    }
  };

  const checkItemRows = checkItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
        <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; ${getStatusStyle(item.value)}">
          ${item.value?.replace("_", " ") || "N/A"}
        </span>
      </td>
    </tr>
  `,
    )
    .join("");

  const overallStatusStyle =
    check.overallStatus === "PASS"
      ? "background: #dcfce7; color: #166534;"
      : check.overallStatus === "FAIL"
        ? "background: #fef2f2; color: #dc2626;"
        : "background: #fef3c7; color: #92400e;";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #8b5cf6; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 14px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #8b5cf6; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .info-item { background: #f9fafb; padding: 12px; border-radius: 6px; }
        .info-label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #8b5cf6; color: white; padding: 10px; text-align: left; }
        .overall-status { display: inline-block; padding: 8px 20px; border-radius: 8px; font-size: 18px; font-weight: bold; }
        .tool-type-badge { display: inline-block; padding: 6px 14px; border-radius: 6px; font-size: 14px; font-weight: 600; background: #f3e8ff; color: #7c3aed; }
        .signature-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-top: 10px; }
        .signature-label { font-size: 12px; color: #666; margin-bottom: 8px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">CortexBuild Pro</div>
          <div class="subtitle">Tool Safety Inspection Report</div>
        </div>
        <div style="text-align: right;">
          <div class="subtitle">Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <div>
          <div class="title">${check.toolName || "Tool Inspection"}</div>
          <span class="tool-type-badge">${toolTypeLabels[check.toolType] || check.toolType}</span>
        </div>
        <div class="overall-status" style="${overallStatusStyle}">
          ${check.overallStatus?.replace("_", " ") || "PENDING"}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Tool & Inspection Details</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Project</div>
            <div class="info-value">${check.project.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Check Date</div>
            <div class="info-value">${format(new Date(check.checkDate), "dd/MM/yyyy HH:mm")}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Serial Number</div>
            <div class="info-value">${check.serialNumber || "-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Manufacturer</div>
            <div class="info-value">${check.manufacturer || "-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Model</div>
            <div class="info-value">${check.model || "-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Location</div>
            <div class="info-value">${check.location || "-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Inspector</div>
            <div class="info-value">${check.inspector?.name || "Not specified"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Safe to Use</div>
            <div class="info-value" style="${check.safeToUse ? "color: #166534;" : "color: #dc2626;"}">
              ${check.safeToUse ? "YES ✓" : "NO ✗"}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Inspection Checklist</div>
        <table>
          <thead>
            <tr>
              <th>Inspection Item</th>
              <th style="width: 150px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${checkItemRows || '<tr><td colspan="2" style="padding: 20px; text-align: center; color: #666;">No checklist items</td></tr>'}
          </tbody>
        </table>
      </div>

      ${
        check.defectsFound
          ? `
      <div class="section">
        <div class="section-title" style="color: #dc2626;">Defects Found</div>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
          ${check.defectsFound}
        </div>
      </div>
      `
          : ""
      }

      ${
        check.actionsTaken
          ? `
      <div class="section">
        <div class="section-title">Actions Taken</div>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
          ${check.actionsTaken}
        </div>
      </div>
      `
          : ""
      }

      <div class="section">
        <div class="section-title">Inspector Signature</div>
        <div class="signature-box">
          ${
            check.inspectorSignature
              ? `<img src="${check.inspectorSignature}" style="max-height: 60px; max-width: 200px;" alt="Inspector Signature"/>`
              : '<div style="color: #999; font-style: italic;">Not signed</div>'
          }
          <div style="margin-top: 8px; font-size: 12px; color: #666;">
            ${check.inspector?.name || ""} ${check.signedAt ? `- ${format(new Date(check.signedAt), "dd/MM/yyyy HH:mm")}` : ""}
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This document was automatically generated by CortexBuild Pro Construction Management System</p>
        <p>Document ID: ${check.id}</p>
      </div>
    </body>
    </html>
  `;
}
