// =====================================================
// PDF GENERATOR
// Generate PDFs using pdfkit
// =====================================================

import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

export interface PDFOptions {
  size?: 'A4' | 'Letter';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  font?: string;
  fontSize?: number;
}

const DEFAULT_OPTIONS: PDFOptions = {
  size: 'A4',
  margins: { top: 40, right: 40, bottom: 40, left: 40 },
  fontSize: 12,
};

/**
 * Generate a PDF from HTML-like content structure
 * This is a simplified PDF generator - for complex HTML rendering,
 * consider using @react-pdf/renderer or a service
 */
export async function generatePDF(content: {
  title: string;
  subtitle?: string;
  sections: Array<{
    title?: string;
    content: Array<{
      type: 'text' | 'heading' | 'table' | 'spacer';
      text?: string;
      style?: 'normal' | 'bold' | 'italic';
      data?: string[][];
      height?: number;
    }>;
  }>;
  footer?: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(DEFAULT_OPTIONS);
    const chunks: Buffer[] = [];

    const stream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    doc.pipe(stream);

    // Header
    if (content.title) {
      doc.fontSize(18).font('Helvetica-Bold').text(content.title, { align: 'center' });
      doc.moveDown(0.5);
    }

    if (content.subtitle) {
      doc.fontSize(12).font('Helvetica').text(content.subtitle, { align: 'center' });
      doc.moveDown(1);
    }

    // Sections
    for (const section of content.sections) {
      if (section.title) {
        doc.fontSize(14).font('Helvetica-Bold').text(section.title, { underline: true });
        doc.moveDown(0.5);
      }

      for (const item of section.content) {
        switch (item.type) {
          case 'heading':
            doc.fontSize(12).font('Helvetica-Bold').text(item.text || '');
            doc.moveDown(0.3);
            break;
          case 'text':
            doc.fontSize(DEFAULT_OPTIONS.fontSize || 12).font('Helvetica').text(item.text || '');
            doc.moveDown(0.5);
            break;
          case 'spacer':
            doc.moveDown(item.height || 1);
            break;
          case 'table':
            if (item.data && item.data.length > 0) {
              const tableTop = doc.y;
              const tableLeft = doc.x;
              const cellPadding = 5;
              const rowHeight = 20;

              // Draw header row
              doc.setFillColor('#f0f0f0');
              doc.rect(tableLeft, tableTop, doc.page.width - 80, rowHeight);
              doc.fill();

              // Draw table borders
              doc.strokeColor('#cccccc').rect(tableLeft, tableTop, doc.page.width - 80, rowHeight * item.data.length);
              doc.stroke();

              // Draw header text
              doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
              item.data[0].forEach((cell, i) => {
                doc.text(cell, tableLeft + cellPadding, tableTop + cellPadding, { width: 100 });
              });

              // Draw data rows
              item.data.slice(1).forEach((row, rowIndex) => {
                const rowTop = tableTop + (rowIndex + 1) * rowHeight;
                row.forEach((cell, i) => {
                  doc.fontSize(10).font('Helvetica').fillColor('#333333');
                  doc.text(cell, tableLeft + cellPadding, rowTop + cellPadding, { width: 100 });
                });
              });

              doc.moveDown(1);
            }
            break;
        }
      }

      doc.moveDown(0.5);
    }

    // Footer
    if (content.footer) {
      doc.fontSize(10).font('Helvetica').text(content.footer, { align: 'center' });
    }

    doc.end();

    stream.on('finish', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', reject);
  });
}

/**
 * Generate PDF from HTML content (simpler approach using basic PDF)
 */
export async function generateHTMLPdf(htmlContent: string, options?: PDFOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(options || DEFAULT_OPTIONS);
    const chunks: Buffer[] = [];

    const stream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    doc.pipe(stream);

    // Simple HTML parsing - convert basic HTML to PDF text
    const textContent = htmlContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    doc.fontSize(12).font('Helvetica').text(textContent, { align: 'left' });

    doc.end();

    stream.on('finish', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', reject);
  });
}

/**
 * Generate report PDF with structured data
 */
export async function generateReportPDF(
  reportType: string,
  data: any,
  userName: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, right: 50, bottom: 50, left: 50 },
    });
    const chunks: Buffer[] = [];

    const stream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('CortexBuild Pro Report', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString('en-GB')} by ${userName}`, { align: 'center' });
    doc.moveDown(1);

    if (reportType === 'project_summary' && data.project) {
      const p = data.project;
      const completedTasks = p.tasks?.filter((t: any) => t.status === 'COMPLETE').length || 0;
      const totalTasks = p.tasks?.length || 0;

      doc.fontSize(16).font('Helvetica-Bold').text('Project Overview').underline();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Project: ${p.name}`);
      doc.text(`Status: ${p.status}`);
      doc.text(`Manager: ${p.manager?.name || 'Unassigned'}`);
      doc.text(`Location: ${p.location || 'N/A'}`);
      doc.moveDown(0.5);
      doc.text(`Total Tasks: ${totalTasks} | Completed: ${completedTasks}`);
      doc.moveDown(1);

      if (p.tasks && p.tasks.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Tasks').underline();
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        p.tasks.slice(0, 20).forEach((t: any, i: number) => {
          doc.text(`${i + 1}. ${t.title} - ${t.status} (${t.priority})`);
        });
      }
    } else if (reportType === 'budget_report') {
      const items = data.costItems || [];

      doc.fontSize(16).font('Helvetica-Bold').text('Budget Summary').underline();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Cost Items: ${items.length}`);
      doc.moveDown(0.5);

      items.slice(0, 30).forEach((c: any, i: number) => {
        doc.text(`${i + 1}. ${c.description} - ${c.project?.name || 'N/A'}: £${(c.actualAmount || 0).toLocaleString()}`);
      });
    } else if (reportType === 'time_entries') {
      const entries = data.timeEntries || [];

      doc.fontSize(16).font('Helvetica-Bold').text('Time Tracking Report').underline();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Entries: ${entries.length}`);
      doc.moveDown(0.5);

      entries.slice(0, 50).forEach((e: any, i: number) => {
        doc.text(`${i + 1}. ${e.user?.name || 'N/A'} - ${e.project?.name || 'N/A'} - ${e.hours}h`);
      });
    } else {
      // General overview
      const { projects = [], tasks = [] } = data;

      doc.fontSize(16).font('Helvetica-Bold').text('Overview').underline();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Projects: ${projects.length}`);
      doc.text(`Tasks: ${tasks.length}`);
      doc.moveDown(0.5);

      projects.slice(0, 20).forEach((p: any, i: number) => {
        doc.text(`${i + 1}. ${p.name} - ${p.status}`);
      });
    }

    // Footer
    doc.fontSize(10).font('Helvetica').text('\n\nThis report was automatically generated by CortexBuild Pro.', { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', reject);
  });
}
