export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
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

    const toolboxTalk = await prisma.toolboxTalk.findUnique({
      where: { id },
      include: {
        project: { select: { name: true, organizationId: true } },
        presenter: { select: { name: true, email: true } },
        attendees: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    });

    if (!toolboxTalk) {
      return NextResponse.json({ error: "Toolbox talk not found" }, { status: 404 });
    }

    const orgId = (session.user as any).organizationId;
    if (toolboxTalk.project.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const htmlContent = generateToolboxTalkPDF(toolboxTalk);

    // Create PDF request
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
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
        const filename = `toolbox-talk-${toolboxTalk.title.replace(/[^a-zA-Z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        
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

function generateToolboxTalkPDF(talk: any) {
  const attendeeRows = talk.attendees.map((a: any, i: number) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${i + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${a.user?.name || a.guestName || 'Unknown'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${a.user?.email || a.guestEmail || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
        ${a.signatureData ? `<img src="${a.signatureData}" style="max-height: 40px; max-width: 120px;" alt="Signature"/>` : '<span style="color: #999;">Not signed</span>'}
      </td>
      <td style="padding: 8px; border: 1px solid #ddd;">${a.signedAt ? format(new Date(a.signedAt), 'dd/MM/yyyy HH:mm') : '-'}</td>
    </tr>
  `).join('');

  const keyPoints = talk.keyPoints || [];
  const hazards = talk.hazardsDiscussed || [];
  const safetyMeasures = talk.safetyMeasures || [];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 14px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #4F46E5; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .info-item { background: #f9fafb; padding: 12px; border-radius: 6px; }
        .info-label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 500; }
        .list-item { padding: 8px 12px; background: #f0f9ff; border-left: 3px solid #4F46E5; margin-bottom: 8px; border-radius: 0 4px 4px 0; }
        .hazard-item { background: #fef2f2; border-left-color: #ef4444; }
        .safety-item { background: #f0fdf4; border-left-color: #22c55e; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #4F46E5; color: white; padding: 10px; text-align: left; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-in-progress { background: #fef3c7; color: #92400e; }
        .status-scheduled { background: #dbeafe; color: #1e40af; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">CortexBuild Pro</div>
          <div class="subtitle">Toolbox Talk Record</div>
        </div>
        <div style="text-align: right;">
          <div class="subtitle">Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
        </div>
      </div>

      <div class="title">${talk.title}</div>
      <span class="status-badge status-${talk.status.toLowerCase().replace('_', '-')}">${talk.status.replace('_', ' ')}</span>

      <div class="section" style="margin-top: 25px;">
        <div class="section-title">Talk Details</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Project</div>
            <div class="info-value">${talk.project.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date & Time</div>
            <div class="info-value">${format(new Date(talk.date), 'dd/MM/yyyy')} at ${talk.time || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Topic</div>
            <div class="info-value">${talk.topic || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Location</div>
            <div class="info-value">${talk.location || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Presenter</div>
            <div class="info-value">${talk.presenter?.name || 'Not assigned'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Total Attendees</div>
            <div class="info-value">${talk.attendees.length}</div>
          </div>
        </div>
      </div>

      ${talk.description ? `
      <div class="section">
        <div class="section-title">Description</div>
        <p>${talk.description}</p>
      </div>
      ` : ''}

      ${keyPoints.length > 0 ? `
      <div class="section">
        <div class="section-title">Key Points Discussed</div>
        ${keyPoints.map((p: string) => `<div class="list-item">${p}</div>`).join('')}
      </div>
      ` : ''}

      ${hazards.length > 0 ? `
      <div class="section">
        <div class="section-title">Hazards Discussed</div>
        ${hazards.map((h: string) => `<div class="list-item hazard-item">${h}</div>`).join('')}
      </div>
      ` : ''}

      ${safetyMeasures.length > 0 ? `
      <div class="section">
        <div class="section-title">Safety Measures</div>
        ${safetyMeasures.map((s: string) => `<div class="list-item safety-item">${s}</div>`).join('')}
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Attendance Register</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Name</th>
              <th>Email</th>
              <th style="width: 140px;">Signature</th>
              <th style="width: 140px;">Signed At</th>
            </tr>
          </thead>
          <tbody>
            ${attendeeRows || '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #666;">No attendees recorded</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>This document was automatically generated by CortexBuild Pro Construction Management System</p>
        <p>Document ID: ${talk.id}</p>
      </div>
    </body>
    </html>
  `;
}
