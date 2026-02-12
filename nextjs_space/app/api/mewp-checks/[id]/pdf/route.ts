import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mewpCheck = await prisma.mEWPCheck.findUnique({
      where: { id: id },
      include: {
        project: { select: { name: true, organizationId: true } },
        operator: { select: { name: true, email: true } },
        supervisor: { select: { name: true, email: true } },
        equipment: { select: { name: true, serialNumber: true, model: true } }
      }
    });

    if (!mewpCheck) {
      return NextResponse.json({ error: "MEWP check not found" }, { status: 404 });
    }

    const orgId = (session.user as any).organizationId;
    if (mewpCheck.project.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const htmlContent = generateMEWPCheckPDF(mewpCheck);

    // Create PDF request
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        html_content: htmlContent,
        pdf_options: { format: 'A4', print_background: true },
        base_url: process.env.NEXTAUTH_URL || '',
      }),
    });

    if (!createResponse.ok) {
      return NextResponse.json({ error: 'Failed to create PDF request' }, { status: 500 });
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json({ error: 'No request ID returned' }, { status: 500 });
    }

    // Poll for status
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || 'FAILED';
      const result = statusResult?.result || null;

      if (status === 'SUCCESS' && result?.result) {
        const pdfBuffer = Buffer.from(result.result, 'base64');
        const filename = `mewp-check-${mewpCheck.equipmentName?.replace(/[^a-zA-Z0-9]/g, '-') || 'equipment'}-${format(new Date(mewpCheck.checkDate), 'yyyy-MM-dd')}.pdf`;
        
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } else if (status === 'FAILED') {
        return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
      }
      attempts++;
    }

    return NextResponse.json({ error: 'PDF generation timed out' }, { status: 500 });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateMEWPCheckPDF(check: any) {
  const checkItems = [
    { name: 'Visual Inspection', value: check.visualInspection },
    { name: 'Guardrails Secure', value: check.guardrailsSecure },
    { name: 'Floor Condition', value: check.floorCondition },
    { name: 'Controls Function', value: check.controlsFunction },
    { name: 'Emergency Controls', value: check.emergencyControls },
    { name: 'Wheels & Tyres', value: check.wheelsAndTyres },
    { name: 'Outriggers/Stabilizers', value: check.outriggersStabilizers },
    { name: 'Hydraulic System', value: check.hydraulicSystem },
    { name: 'Electrical System', value: check.electricalSystem },
    { name: 'Safety Devices', value: check.safetyDevices },
    { name: 'Warning Alarms', value: check.warningAlarms },
    { name: 'Manual Override', value: check.manualOverride },
    { name: 'Load Plate Visible', value: check.loadPlateVisible },
    { name: 'User Manual Present', value: check.userManualPresent },
  ];

  const getStatusStyle = (value: string) => {
    switch (value) {
      case 'OK': return 'background: #dcfce7; color: #166534;';
      case 'DEFECTIVE': return 'background: #fef2f2; color: #dc2626;';
      case 'NEEDS_REPAIR': return 'background: #fef3c7; color: #92400e;';
      default: return 'background: #f3f4f6; color: #6b7280;';
    }
  };

  const checkItemRows = checkItems.map(item => `
    <tr>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
        <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; ${getStatusStyle(item.value)}">
          ${item.value?.replace('_', ' ') || 'N/A'}
        </span>
      </td>
    </tr>
  `).join('');

  const overallStatusStyle = check.overallStatus === 'PASS' 
    ? 'background: #dcfce7; color: #166534;' 
    : check.overallStatus === 'FAIL' 
      ? 'background: #fef2f2; color: #dc2626;' 
      : 'background: #fef3c7; color: #92400e;';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #f97316; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 14px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #f97316; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .info-item { background: #f9fafb; padding: 12px; border-radius: 6px; }
        .info-label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f97316; color: white; padding: 10px; text-align: left; }
        .overall-status { display: inline-block; padding: 8px 20px; border-radius: 8px; font-size: 18px; font-weight: bold; }
        .signature-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-top: 10px; }
        .signature-label { font-size: 12px; color: #666; margin-bottom: 8px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">CortexBuild Pro</div>
          <div class="subtitle">MEWP Pre-Use Inspection Report</div>
        </div>
        <div style="text-align: right;">
          <div class="subtitle">Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <div class="title">${check.equipmentName || check.equipment?.name || 'MEWP Equipment'}</div>
        <div class="overall-status" style="${overallStatusStyle}">
          ${check.overallStatus?.replace('_', ' ') || 'PENDING'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Equipment & Inspection Details</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Project</div>
            <div class="info-value">${check.project.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Check Date</div>
            <div class="info-value">${format(new Date(check.checkDate), 'dd/MM/yyyy HH:mm')}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Serial Number</div>
            <div class="info-value">${check.serialNumber || check.equipment?.serialNumber || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Model</div>
            <div class="info-value">${check.model || check.equipment?.model || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Manufacturer</div>
            <div class="info-value">${check.manufacturer || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Location</div>
            <div class="info-value">${check.location || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Weather Conditions</div>
            <div class="info-value">${check.weatherConditions || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Wind Speed</div>
            <div class="info-value">${check.windSpeed ? `${check.windSpeed} mph` : '-'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Operator Certification</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Operator</div>
            <div class="info-value">${check.operator?.name || 'Not specified'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Certification Number</div>
            <div class="info-value">${check.operatorCertNumber || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Certification Expiry</div>
            <div class="info-value">${check.operatorCertExpiry ? format(new Date(check.operatorCertExpiry), 'dd/MM/yyyy') : '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Safe to Use</div>
            <div class="info-value" style="${check.safeToUse ? 'color: #166534;' : 'color: #dc2626;'}">
              ${check.safeToUse ? 'YES ✓' : 'NO ✗'}
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
            ${checkItemRows}
          </tbody>
        </table>
      </div>

      ${check.defectsFound ? `
      <div class="section">
        <div class="section-title" style="color: #dc2626;">Defects Found</div>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
          ${check.defectsFound}
        </div>
      </div>
      ` : ''}

      ${check.actionsTaken ? `
      <div class="section">
        <div class="section-title">Actions Taken</div>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
          ${check.actionsTaken}
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Signatures</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
          <div class="signature-box">
            <div class="signature-label">Operator Signature</div>
            ${check.operatorSignature 
              ? `<img src="${check.operatorSignature}" style="max-height: 60px; max-width: 200px;" alt="Operator Signature"/>`
              : '<div style="color: #999; font-style: italic;">Not signed</div>'
            }
            <div style="margin-top: 8px; font-size: 12px; color: #666;">
              ${check.operator?.name || ''} ${check.operatorSignedAt ? `- ${format(new Date(check.operatorSignedAt), 'dd/MM/yyyy HH:mm')}` : ''}
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-label">Supervisor Sign-off</div>
            ${check.supervisorSignature 
              ? `<img src="${check.supervisorSignature}" style="max-height: 60px; max-width: 200px;" alt="Supervisor Signature"/>`
              : '<div style="color: #999; font-style: italic;">Not signed</div>'
            }
            <div style="margin-top: 8px; font-size: 12px; color: #666;">
              ${check.supervisor?.name || ''} ${check.supervisorSignedAt ? `- ${format(new Date(check.supervisorSignedAt), 'dd/MM/yyyy HH:mm')}` : ''}
            </div>
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
