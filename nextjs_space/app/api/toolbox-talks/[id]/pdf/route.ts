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

    const toolboxTalk = await prisma.toolboxTalk.findUnique({
      where: { id: id },
      include: {
        project: { select: { name: true, organizationId: true } },
        presenter: { select: { name: true, email: true } },
        attendees: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!toolboxTalk) {
      return NextResponse.json(
        { error: "Toolbox talk not found" },
        { status: 404 },
      );
    }

    const orgId = (session.user as any).organizationId;
    if (toolboxTalk.project.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pdfBuffer = await generateToolboxTalkPDF(toolboxTalk);
    const filename = `toolbox-talk-${toolboxTalk.title.replace(/[^a-zA-Z0-9]/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;

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

async function generateToolboxTalkPDF(talk: any): Promise<Buffer> {
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
    doc.fontSize(10).font('Helvetica').text('Toolbox Talk Record', { align: 'left' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, { align: 'right' });
    doc.moveDown(1);

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text(talk.title, { underline: true });
    doc.fontSize(12).font('Helvetica').text(`Status: ${talk.status.replace("_", " ")}`);
    doc.moveDown(1);

    // Talk details
    doc.fontSize(14).font('Helvetica-Bold').text('Talk Details').underline();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Project: ${talk.project.name}`);
    doc.text(`Date: ${format(new Date(talk.date), "dd/MM/yyyy")}`);
    doc.text(`Time: ${talk.time || "N/A"}`);
    doc.text(`Topic: ${talk.topic || "-"}`);
    doc.text(`Location: ${talk.location || "-"}`);
    doc.text(`Presenter: ${talk.presenter?.name || "Not assigned"}`);
    doc.text(`Attendees: ${talk.attendees.length}`);
    doc.moveDown(0.5);

    if (talk.description) {
      doc.fontSize(12).font('Helvetica-Bold').text('Description').underline();
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(talk.description);
      doc.moveDown(0.5);
    }

    if (talk.keyPoints && talk.keyPoints.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Key Points Discussed').underline();
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica');
      talk.keyPoints.forEach((p: string, i: number) => {
        doc.text(`${i + 1}. ${p}`);
      });
      doc.moveDown(0.5);
    }

    if (talk.hazardsDiscussed && talk.hazardsDiscussed.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Hazards Discussed').underline();
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica');
      talk.hazardsDiscussed.forEach((h: string, i: number) => {
        doc.text(`${i + 1}. ${h}`);
      });
      doc.moveDown(0.5);
    }

    if (talk.safetyMeasures && talk.safetyMeasures.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Safety Measures').underline();
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica');
      talk.safetyMeasures.forEach((s: string, i: number) => {
        doc.text(`${i + 1}. ${s}`);
      });
      doc.moveDown(0.5);
    }

    // Attendance
    doc.fontSize(14).font('Helvetica-Bold').text('Attendance Register').underline();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    talk.attendees.forEach((a: any, i: number) => {
      doc.text(`${i + 1}. ${a.user?.name || a.guestName || "Unknown"} (${a.user?.email || a.guestEmail || "-"})`);
    });
    doc.moveDown(1);

    // Footer
    doc.fontSize(10).font('Helvetica').text('This document was automatically generated by CortexBuild Pro.', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Document ID: ${talk.id}`, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
