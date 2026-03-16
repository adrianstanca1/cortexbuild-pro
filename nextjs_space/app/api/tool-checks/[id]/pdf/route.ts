import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import PDFDocument from "pdfkit";
import { Writable } from "stream";

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

    const pdfBuffer = await generateToolCheckPDF(toolCheck);
    const filename = `tool-check-${toolCheck.toolName?.replace(/[^a-zA-Z0-9]/g, "-") || "tool"}-${format(new Date(toolCheck.checkDate), "yyyy-MM-dd")}.pdf`;

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

async function generateToolCheckPDF(check: any): Promise<Buffer> {
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
    doc.fontSize(10).font('Helvetica').text('Tool Safety Inspection Report', { align: 'left' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, { align: 'right' });
    doc.moveDown(1);

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text(check.toolName || "Tool Inspection", { underline: true });
    doc.fontSize(12).font('Helvetica').text(`Type: ${check.toolType || "N/A"}`);
    doc.fontSize(12).font('Helvetica').text(`Status: ${check.overallStatus?.replace("_", " ") || "PENDING"}`);
    doc.moveDown(1);

    // Details
    doc.fontSize(14).font('Helvetica-Bold').text('Tool & Inspection Details').underline();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Project: ${check.project.name}`);
    doc.text(`Check Date: ${format(new Date(check.checkDate), "dd/MM/yyyy HH:mm")}`);
    doc.text(`Serial Number: ${check.serialNumber || "-"}`);
    doc.text(`Manufacturer: ${check.manufacturer || "-"}`);
    doc.text(`Model: ${check.model || "-"}`);
    doc.text(`Location: ${check.location || "-"}`);
    doc.text(`Inspector: ${check.inspector?.name || "Not specified"}`);
    doc.text(`Safe to Use: ${check.safeToUse ? "YES" : "NO"}`);
    doc.moveDown(0.5);

    // Checklist items
    doc.fontSize(14).font('Helvetica-Bold').text('Inspection Checklist').underline();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    const items: { name: string; value: string }[] = [];
    if (check.visualCondition !== undefined) items.push({ name: "Visual Condition", value: check.visualCondition });
    if (check.cleanAndFree !== undefined) items.push({ name: "Clean & Free of Debris", value: check.cleanAndFree });
    if (check.properStorage !== undefined) items.push({ name: "Proper Storage", value: check.properStorage });
    if (check.guardsIntact !== undefined) items.push({ name: "Guards Intact", value: check.guardsIntact });
    if (check.cordCondition !== undefined) items.push({ name: "Cord Condition", value: check.cordCondition });
    if (check.switchFunction !== undefined) items.push({ name: "Switch Function", value: check.switchFunction });
    if (check.properGrounding !== undefined) items.push({ name: "Proper Grounding", value: check.properGrounding });
    if (check.ventilationClear !== undefined) items.push({ name: "Ventilation Clear", value: check.ventilationClear });
    if (check.batteryCondition !== undefined) items.push({ name: "Battery Condition", value: check.batteryCondition });
    if (check.handlesSecure !== undefined) items.push({ name: "Handles Secure", value: check.handlesSecure });
    if (check.cuttingEdgesSharp !== undefined) items.push({ name: "Cutting Edges Sharp", value: check.cuttingEdgesSharp });
    if (check.noRustCorrosion !== undefined) items.push({ name: "No Rust/Corrosion", value: check.noRustCorrosion });
    if (check.rungsIntact !== undefined) items.push({ name: "Rungs Intact", value: check.rungsIntact });
    if (check.feetCondition !== undefined) items.push({ name: "Feet Condition", value: check.feetCondition });
    if (check.platformsSecure !== undefined) items.push({ name: "Platforms Secure", value: check.platformsSecure });
    if (check.guardrailsInPlace !== undefined) items.push({ name: "Guardrails in Place", value: check.guardrailsInPlace });

    items.forEach((item, i) => {
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

    // Signature
    doc.fontSize(14).font('Helvetica-Bold').text('Inspector Signature').underline();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Inspector: ${check.inspector?.name || "N/A"} ${check.signedAt ? `- ${format(new Date(check.signedAt), "dd/MM/yyyy HH:mm")}` : ""}`);
    doc.moveDown(1);

    // Footer
    doc.fontSize(10).font('Helvetica').text('This document was automatically generated by CortexBuild Pro.', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Document ID: ${check.id}`, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
