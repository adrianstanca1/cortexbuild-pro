import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import PDFDocument from "pdfkit";
import { Writable } from "stream";

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

    const mewpCheck = await prisma.mEWPCheck.findUnique({
      where: { id: id },
      include: {
        project: { select: { name: true, organizationId: true } },
        operator: { select: { name: true, email: true } },
        supervisor: { select: { name: true, email: true } },
        equipment: { select: { name: true, serialNumber: true, model: true } },
      },
    });

    if (!mewpCheck) {
      return NextResponse.json(
        { error: "MEWP check not found" },
        { status: 404 },
      );
    }

    const orgId = (session.user as any).organizationId;
    if (mewpCheck.project.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pdfBuffer = await generateMEWPCheckPDF(mewpCheck);
    const filename = `mewp-check-${mewpCheck.equipmentName?.replace(/[^a-zA-Z0-9]/g, "-") || "equipment"}-${format(new Date(mewpCheck.checkDate), "yyyy-MM-dd")}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function generateMEWPCheckPDF(check: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 40, right: 40, bottom: 40, left: 40 } });
    const chunks: Buffer[] = [];

    const stream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    doc.pipe(stream);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('CortexBuild Pro', { align: 'left' });
    doc.fontSize(10).font('Helvetica').text('MEWP Pre-Use Inspection Report', { align: 'left' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, { align: 'right' });
    doc.moveDown(1);

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text(check.equipmentName || check.equipment?.name || "MEWP Equipment", { underline: true });
    doc.fontSize(12).font('Helvetica').text(`Status: ${check.overallStatus?.replace("_", " ") || "PENDING"}`);
    doc.moveDown(1);

    // Details section
    doc.fontSize(14).font('Helvetica-Bold').text('Equipment & Inspection Details').underline();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Project: ${check.project.name}`);
    doc.text(`Check Date: ${format(new Date(check.checkDate), "dd/MM/yyyy HH:mm")}`);
    doc.text(`Serial Number: ${check.serialNumber || check.equipment?.serialNumber || "-"}`);
    doc.text(`Model: ${check.model || check.equipment?.model || "-"}`);
    doc.text(`Manufacturer: ${check.manufacturer || "-"}`);
    doc.text(`Location: ${check.location || "-"}`);
    doc.text(`Weather: ${check.weatherConditions || "-"}`);
    doc.text(`Wind Speed: ${check.windSpeed ? `${check.windSpeed} mph` : "-"}`);
    doc.moveDown(0.5);

    // Operator certification
    doc.fontSize(14).font('Helvetica-Bold').text('Operator Certification').underline();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Operator: ${check.operator?.name || "Not specified"}`);
    doc.text(`Certification Number: ${check.operatorCertNumber || "-"}`);
    doc.text(`Certification Expiry: ${check.operatorCertExpiry ? format(new Date(check.operatorCertExpiry), "dd/MM/yyyy") : "-"}`);
    doc.text(`Safe to Use: ${check.safeToUse ? "YES" : "NO"}`);
    doc.moveDown(0.5);

    // Checklist items
    doc.fontSize(14).font('Helvetica-Bold').text('Inspection Checklist').underline();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    const checkItems = [
      { name: "Visual Inspection", value: check.visualInspection },
      { name: "Guardrails Secure", value: check.guardrailsSecure },
      { name: "Floor Condition", value: check.floorCondition },
      { name: "Controls Function", value: check.controlsFunction },
      { name: "Emergency Controls", value: check.emergencyControls },
      { name: "Wheels & Tyres", value: check.wheelsAndTyres },
      { name: "Outriggers/Stabilizers", value: check.outriggersStabilizers },
      { name: "Hydraulic System", value: check.hydraulicSystem },
      { name: "Electrical System", value: check.electricalSystem },
      { name: "Safety Devices", value: check.safetyDevices },
      { name: "Warning Alarms", value: check.warningAlarms },
      { name: "Manual Override", value: check.manualOverride },
      { name: "Load Plate Visible", value: check.loadPlateVisible },
      { name: "User Manual Present", value: check.userManualPresent },
    ];

    checkItems.forEach((item, i) => {
      doc.text(`${i + 1}. ${item.name}: ${item.value?.replace("_", " ") || "N/A"}`);
    });
    doc.moveDown(0.5);

    if (check.defectsFound) {
      doc.fontSize(12).font('Helvetica-Bold').text('Defects Found').underline();
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(check.defectsFound);
      doc.moveDown(0.5);
    }

    if (check.actionsTaken) {
      doc.fontSize(12).font('Helvetica-Bold').text('Actions Taken').underline();
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(check.actionsTaken);
      doc.moveDown(0.5);
    }

    // Signatures
    doc.fontSize(14).font('Helvetica-Bold').text('Signatures').underline();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Operator: ${check.operator?.name || "N/A"} ${check.operatorSignedAt ? `- ${format(new Date(check.operatorSignedAt), "dd/MM/yyyy HH:mm")}` : ""}`);
    doc.text(`Supervisor: ${check.supervisor?.name || "N/A"} ${check.supervisorSignedAt ? `- ${format(new Date(check.supervisorSignedAt), "dd/MM/yyyy HH:mm")}` : ""}`);
    doc.moveDown(1);

    // Footer
    doc.fontSize(10).font('Helvetica').text('This document was automatically generated by CortexBuild Pro.', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Document ID: ${check.id}`, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
