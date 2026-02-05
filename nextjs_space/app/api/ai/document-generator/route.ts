import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

const ABACUS_API_URL = 'https://api.abacus.ai/api/v0/chat';

type DocumentType = 
  | 'method_statement'
  | 'risk_assessment'
  | 'site_induction'
  | 'permit_to_work'
  | 'toolbox_talk'
  | 'inspection_checklist'
  | 'completion_certificate'
  | 'handover_document';

interface DocumentContext {
  projectName: string;
  projectLocation: string;
  clientName: string;
  principalContractor?: string;
  workDescription: string;
  startDate?: string;
  endDate?: string;
  hazards?: string[];
  controls?: string[];
  ppe?: string[];
  personnel?: string[];
  equipment?: string[];
  emergencyProcedures?: string;
  additionalNotes?: string;
}

const documentPrompts: Record<DocumentType, (ctx: DocumentContext) => string> = {
  method_statement: (ctx) => `Generate a comprehensive CDM 2015 compliant Method Statement for the following construction work:

Project: ${ctx.projectName}
Location: ${ctx.projectLocation}
Client: ${ctx.clientName}
Work Description: ${ctx.workDescription}
${ctx.startDate ? `Start Date: ${ctx.startDate}` : ''}
${ctx.hazards?.length ? `Identified Hazards: ${ctx.hazards.join(', ')}` : ''}
${ctx.controls?.length ? `Control Measures: ${ctx.controls.join(', ')}` : ''}
${ctx.ppe?.length ? `PPE Required: ${ctx.ppe.join(', ')}` : ''}

Format the method statement with these sections:
1. Document Control
2. Project Information
3. Scope of Works
4. Health & Safety Legislation (CDM 2015)
5. Roles and Responsibilities
6. Sequence of Operations
7. Risk Assessment Summary
8. Control Measures
9. PPE Requirements
10. Emergency Procedures
11. Sign-off Section

Use UK construction terminology and ensure full CDM 2015 compliance.`,

  risk_assessment: (ctx) => `Generate a comprehensive CDM 2015 compliant Risk Assessment for:

Project: ${ctx.projectName}
Location: ${ctx.projectLocation}
Activity: ${ctx.workDescription}
${ctx.hazards?.length ? `Known Hazards: ${ctx.hazards.join(', ')}` : ''}

Create a detailed risk assessment including:
1. Document Information
2. Activity Description
3. Persons at Risk
4. Hazard Identification Table with Likelihood, Severity, Risk Rating
5. Control Measures
6. Emergency Procedures
7. Sign-off

Use the 5x5 risk matrix standard. UK construction standards apply.`,

  site_induction: (ctx) => `Generate a comprehensive Site Induction document for:

Project: ${ctx.projectName}
Location: ${ctx.projectLocation}
Client: ${ctx.clientName}

Create a complete site induction covering:
1. Welcome & Project Overview
2. Site Rules and Requirements
3. CDM 2015 Duties
4. Site Layout and Access Points
5. First Aid Arrangements
6. Fire Safety & Emergency Procedures
7. PPE Requirements
8. Accident Reporting (RIDDOR)
9. Communication Channels
10. Induction Sign-off Sheet

UK HSE standards.`,

  permit_to_work: (ctx) => `Generate a Permit to Work document for:

Project: ${ctx.projectName}
Location: ${ctx.projectLocation}
Work Activity: ${ctx.workDescription}
${ctx.hazards?.length ? `Hazards: ${ctx.hazards.join(', ')}` : ''}

Create a formal Permit to Work including:
1. Permit Number and Type
2. Location of Work
3. Description of Work
4. Duration
5. Hazards Identified
6. Precautions Required
7. PPE Required
8. Emergency Procedures
9. Authorization Section
10. Clearance Section

Follow UK permit to work best practices.`,

  toolbox_talk: (ctx) => `Generate a Toolbox Talk document on:

Topic: ${ctx.workDescription}
Project: ${ctx.projectName}

Create an engaging 10-15 minute toolbox talk including:
1. Talk Reference Number and Date
2. Topic Title
3. Key Learning Points
4. Relevant Legislation
5. Best Practices
6. Discussion Questions
7. Key Takeaways
8. Attendee Sign-off Sheet

Make it practical and focused on real site scenarios. UK construction context.`,

  inspection_checklist: (ctx) => `Generate an Inspection Checklist for:

Inspection Type: ${ctx.workDescription}
Project: ${ctx.projectName}
Location: ${ctx.projectLocation}

Create a comprehensive checklist including:
1. Inspection Reference and Date
2. Inspector Details
3. Checklist Items (minimum 20 relevant items)
4. Overall Assessment
5. Defects Requiring Action
6. Follow-up Actions
7. Sign-off

Align with UK construction inspection standards.`,

  completion_certificate: (ctx) => `Generate a Practical Completion Certificate for:

Project: ${ctx.projectName}
Location: ${ctx.projectLocation}
Client: ${ctx.clientName}
Work Completed: ${ctx.workDescription}

Create a formal completion certificate including:
1. Certificate Reference Number
2. Project Details
3. Description of Works
4. Practical Completion Date
5. Defects Liability Period
6. Outstanding Snagging Items
7. Handover Documentation Checklist
8. Client Sign-off
9. Contractor Sign-off

Follow UK JCT/NEC contract completion standards.`,

  handover_document: (ctx) => `Generate a Project Handover Document for:

Project: ${ctx.projectName}
Location: ${ctx.projectLocation}
Client: ${ctx.clientName}
Works: ${ctx.workDescription}

Create comprehensive handover documentation including:
1. Handover Summary
2. Project Information
3. Key Contacts
4. Documentation Handed Over
5. Building Systems Overview
6. Maintenance Schedule
7. Emergency Procedures
8. Outstanding Defects
9. Training Provided
10. Client Acceptance Sign-off

UK building handover best practices apply.`
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentType, projectId, context } = body as {
      documentType: DocumentType;
      projectId?: string;
      context: DocumentContext;
    };

    if (!documentType || !context) {
      return NextResponse.json(
        { error: 'Document type and context are required' },
        { status: 400 }
      );
    }

    // Get project details if projectId provided
    let projectData: { name: string; location: string | null; clientName: string | null } | null = null;
    if (projectId) {
      projectData = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId: session.user.organizationId!,
        },
        select: {
          name: true,
          location: true,
          clientName: true,
        },
      });
    }

    const enhancedContext: DocumentContext = {
      ...context,
      projectName: context.projectName || projectData?.name || 'Project',
      projectLocation: context.projectLocation || projectData?.location || 'Site Location',
      clientName: context.clientName || projectData?.clientName || 'Client',
    };

    const promptFn = documentPrompts[documentType];
    if (!promptFn) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    const prompt = promptFn(enhancedContext);

    const response = await fetch(ABACUS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a UK construction document specialist with expertise in CDM 2015 regulations. Generate professional, compliant documents using proper UK terminology.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Abacus API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate document' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || data.content || '';

    return NextResponse.json({
      success: true,
      documentType,
      content: generatedContent,
      generatedAt: new Date().toISOString(),
      projectName: enhancedContext.projectName,
    });
  } catch {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
