import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Helper to extract text from PDF (basic extraction)
function extractTextFromPDF(buffer: ArrayBuffer): string {
  // Simple text extraction - in production, use a proper PDF parser
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  // Extract readable text patterns
  const matches = text.match(/\(([^)]+)\)/g) || [];
  return matches.map(m => m.slice(1, -1)).join(' ').replace(/\s+/g, ' ').trim();
}

// Helper to parse document content into template structure
function parseDocumentContent(text: string, filename: string): {
  name: string;
  sections: { id: string; title: string; fields: { name: string; label: string; type: string; required: boolean }[] }[];
} {
  // Extract template name from filename
  const name = filename
    .replace(/\.(pdf|doc|docx|txt|json)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  // Try to identify sections based on common patterns
  const sections: { id: string; title: string; fields: { name: string; label: string; type: string; required: boolean }[] }[] = [];
  
  // Common construction document section patterns
  const sectionPatterns = [
    { pattern: /project\s*(info|details|information)/i, title: 'Project Information' },
    { pattern: /scope\s*(of\s*work)?/i, title: 'Scope of Works' },
    { pattern: /hazard/i, title: 'Hazard Identification' },
    { pattern: /risk/i, title: 'Risk Assessment' },
    { pattern: /control\s*measure/i, title: 'Control Measures' },
    { pattern: /ppe|personal\s*protective/i, title: 'PPE Requirements' },
    { pattern: /emergency/i, title: 'Emergency Procedures' },
    { pattern: /signature/i, title: 'Signatures' },
    { pattern: /approval/i, title: 'Approval' },
    { pattern: /attendance/i, title: 'Attendance' },
    { pattern: /checklist/i, title: 'Checklist' }
  ];

  // Find sections in text
  const foundSections = new Set<string>();
  sectionPatterns.forEach(({ pattern, title }) => {
    if (pattern.test(text) && !foundSections.has(title)) {
      foundSections.add(title);
      const id = title.toLowerCase().replace(/\s+/g, '_');
      sections.push({
        id,
        title,
        fields: []
      });
    }
  });

  // If no sections found, create a default structure
  if (sections.length === 0) {
    sections.push(
      { id: 'details', title: 'Details', fields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'location', label: 'Location', type: 'text', required: false },
        { name: 'description', label: 'Description', type: 'textarea', required: false }
      ]},
      { id: 'content', title: 'Content', fields: [
        { name: 'mainContent', label: 'Main Content', type: 'textarea', required: true }
      ]},
      { id: 'signatures', title: 'Signatures', fields: [
        { name: 'preparedBy', label: 'Prepared By', type: 'signature', required: true },
        { name: 'approvedBy', label: 'Approved By', type: 'signature', required: false }
      ]}
    );
  } else {
    // Add common fields to found sections
    sections.forEach(section => {
      if (section.title === 'Project Information') {
        section.fields = [
          { name: 'projectName', label: 'Project Name', type: 'text', required: true },
          { name: 'location', label: 'Location', type: 'text', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'preparedBy', label: 'Prepared By', type: 'text', required: true }
        ];
      } else if (section.title === 'Hazard Identification' || section.title === 'Risk Assessment') {
        section.fields = [
          { name: 'hazards', label: 'Identified Hazards', type: 'textarea', required: true },
          { name: 'likelihood', label: 'Likelihood (1-5)', type: 'number', required: true },
          { name: 'severity', label: 'Severity (1-5)', type: 'number', required: true }
        ];
      } else if (section.title === 'Control Measures') {
        section.fields = [
          { name: 'controls', label: 'Control Measures', type: 'textarea', required: true },
          { name: 'residualRisk', label: 'Residual Risk Level', type: 'select', required: false }
        ];
      } else if (section.title === 'PPE Requirements') {
        section.fields = [
          { name: 'ppe', label: 'Required PPE', type: 'checklist', required: true }
        ];
      } else if (section.title === 'Emergency Procedures') {
        section.fields = [
          { name: 'procedures', label: 'Emergency Procedures', type: 'textarea', required: true },
          { name: 'firstAider', label: 'First Aider', type: 'text', required: false },
          { name: 'assemblyPoint', label: 'Assembly Point', type: 'text', required: false }
        ];
      } else if (section.title === 'Signatures' || section.title === 'Approval') {
        section.fields = [
          { name: 'signature1', label: 'Signature', type: 'signature', required: true },
          { name: 'signatureDate', label: 'Date', type: 'date', required: true }
        ];
      } else if (section.title === 'Attendance') {
        section.fields = [
          { name: 'attendees', label: 'Attendees', type: 'attendance_list', required: true }
        ];
      } else {
        section.fields = [
          { name: 'content', label: 'Content', type: 'textarea', required: false }
        ];
      }
    });
  }

  return { name, sections };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'OTHER';
    const tagsStr = (formData.get('tags') as string) || '';
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.json'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: PDF, Word, TXT, JSON' }, { status: 400 });
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    let textContent = '';
    let parsedContent: any = null;

    if (ext === '.json') {
      // Parse JSON template directly
      try {
        const jsonText = new TextDecoder().decode(buffer);
        parsedContent = JSON.parse(jsonText);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
      }
    } else if (ext === '.txt') {
      textContent = new TextDecoder().decode(buffer);
    } else if (ext === '.pdf') {
      textContent = extractTextFromPDF(buffer);
    } else {
      // For Word docs, extract basic text (simplified)
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      textContent = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    let templateData;
    if (parsedContent && parsedContent.sections) {
      // Use JSON structure directly
      templateData = {
        name: parsedContent.name || parsedContent.title || file.name.replace(/\.[^.]+$/, ''),
        sections: parsedContent.sections
      };
    } else {
      // Parse text content into template structure
      templateData = parseDocumentContent(textContent, file.name);
    }

    // Create the template
    const template = await prisma.documentTemplate.create({
      data: {
        name: templateData.name,
        description: `Uploaded from ${file.name}`,
        category: category as any,
        version: '1.0',
        content: {
          title: templateData.name,
          version: '1.0',
          sections: templateData.sections,
          sourceFile: file.name
        },
        tags,
        isSystemTemplate: false,
        organizationId: session.user.organizationId,
        createdById: session.user.id
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ 
      success: true, 
      template,
      message: `Template created with ${templateData.sections.length} sections`
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    return NextResponse.json({ error: 'Failed to upload template' }, { status: 500 });
  }
}
