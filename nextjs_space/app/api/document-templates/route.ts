import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// System templates that come pre-built
const SYSTEM_TEMPLATES = [
  {
    name: 'Method Statement Template',
    description: 'Standard method statement for construction activities following UK HSE guidelines',
    category: 'METHOD_STATEMENT',
    tags: ['safety', 'compliance', 'HSE'],
    content: {
      title: 'Method Statement',
      version: '1.0',
      sections: [
        { id: 'project_info', title: 'Project Information', fields: [
          { name: 'projectName', label: 'Project Name', type: 'text', required: true },
          { name: 'location', label: 'Site Location', type: 'text', required: true },
          { name: 'preparedBy', label: 'Prepared By', type: 'text', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true }
        ]},
        { id: 'scope', title: 'Scope of Works', fields: [
          { name: 'description', label: 'Description of Works', type: 'textarea', required: true },
          { name: 'sequence', label: 'Sequence of Operations', type: 'textarea', required: true }
        ]},
        { id: 'resources', title: 'Resources Required', fields: [
          { name: 'personnel', label: 'Personnel', type: 'textarea', required: false },
          { name: 'equipment', label: 'Plant & Equipment', type: 'textarea', required: false },
          { name: 'materials', label: 'Materials', type: 'textarea', required: false }
        ]},
        { id: 'hazards', title: 'Hazards & Controls', fields: [
          { name: 'hazards', label: 'Identified Hazards', type: 'checklist', options: ['Working at height', 'Manual handling', 'Electrical hazards', 'Moving vehicles', 'Noise', 'Dust', 'Confined spaces'] },
          { name: 'controls', label: 'Control Measures', type: 'textarea', required: true }
        ]},
        { id: 'ppe', title: 'PPE Requirements', fields: [
          { name: 'ppe', label: 'Required PPE', type: 'checklist', options: ['Hard hat', 'Safety boots', 'Hi-vis vest', 'Safety glasses', 'Gloves', 'Hearing protection', 'Dust mask', 'Harness'] }
        ]},
        { id: 'emergency', title: 'Emergency Procedures', fields: [
          { name: 'emergencyProcedures', label: 'Emergency Procedures', type: 'textarea', required: true },
          { name: 'firstAider', label: 'First Aider', type: 'text', required: true },
          { name: 'fireWarden', label: 'Fire Warden', type: 'text', required: true }
        ]},
        { id: 'signatures', title: 'Signatures', fields: [
          { name: 'preparedSignature', label: 'Prepared By Signature', type: 'signature', required: true },
          { name: 'approvedSignature', label: 'Approved By Signature', type: 'signature', required: true }
        ]}
      ]
    }
  },
  {
    name: 'Risk Assessment Template',
    description: 'Comprehensive risk assessment template compliant with CDM 2015 regulations',
    category: 'RISK_ASSESSMENT',
    tags: ['safety', 'compliance', 'CDM'],
    content: {
      title: 'Risk Assessment',
      version: '1.0',
      sections: [
        { id: 'assessment_info', title: 'Assessment Details', fields: [
          { name: 'assessmentTitle', label: 'Assessment Title', type: 'text', required: true },
          { name: 'assessor', label: 'Assessor Name', type: 'text', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'reviewDate', label: 'Review Date', type: 'date', required: true }
        ]},
        { id: 'activity', title: 'Activity Description', fields: [
          { name: 'activity', label: 'Activity/Task', type: 'textarea', required: true },
          { name: 'location', label: 'Location', type: 'text', required: true },
          { name: 'personsAtRisk', label: 'Persons at Risk', type: 'checklist', options: ['Employees', 'Contractors', 'Visitors', 'Public', 'Young persons'] }
        ]},
        { id: 'risk_matrix', title: 'Risk Assessment Matrix', fields: [
          { name: 'hazards', label: 'Hazard Identification Table', type: 'table', columns: ['Hazard', 'Who is at Risk', 'Existing Controls', 'Likelihood (1-5)', 'Severity (1-5)', 'Risk Rating', 'Additional Controls', 'Residual Risk'] }
        ]},
        { id: 'approval', title: 'Approval', fields: [
          { name: 'assessorSignature', label: 'Assessor Signature', type: 'signature', required: true },
          { name: 'managerSignature', label: 'Manager Approval', type: 'signature', required: true }
        ]}
      ]
    }
  },
  {
    name: 'Toolbox Talk Record',
    description: 'Standard toolbox talk briefing record template',
    category: 'TOOLBOX_TALK',
    tags: ['safety', 'training', 'briefing'],
    content: {
      title: 'Toolbox Talk Record',
      version: '1.0',
      sections: [
        { id: 'talk_info', title: 'Talk Details', fields: [
          { name: 'topic', label: 'Topic', type: 'text', required: true },
          { name: 'presenter', label: 'Presenter', type: 'text', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'duration', label: 'Duration (mins)', type: 'number', required: true }
        ]},
        { id: 'content', title: 'Talk Content', fields: [
          { name: 'keyPoints', label: 'Key Points Covered', type: 'textarea', required: true },
          { name: 'discussion', label: 'Discussion Points Raised', type: 'textarea', required: false }
        ]},
        { id: 'attendance', title: 'Attendance', fields: [
          { name: 'attendees', label: 'Attendee Sign-In', type: 'attendance_list' }
        ]}
      ]
    }
  },
  {
    name: 'Site Induction Checklist',
    description: 'Comprehensive site induction checklist for new workers and visitors',
    category: 'SITE_INDUCTION',
    tags: ['safety', 'induction', 'compliance'],
    content: {
      title: 'Site Induction Checklist',
      version: '1.0',
      sections: [
        { id: 'inductee', title: 'Inductee Details', fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'company', label: 'Company', type: 'text', required: true },
          { name: 'trade', label: 'Trade/Role', type: 'text', required: true },
          { name: 'cscsNumber', label: 'CSCS Card Number', type: 'text', required: false },
          { name: 'date', label: 'Date', type: 'date', required: true }
        ]},
        { id: 'topics', title: 'Induction Topics Covered', fields: [
          { name: 'topics', label: 'Topics', type: 'checklist', options: [
            'Site rules and emergency procedures',
            'First aid arrangements',
            'Fire assembly points',
            'Welfare facilities',
            'Site access and security',
            'PPE requirements',
            'Reporting accidents/near misses',
            'Hazardous areas',
            'Traffic management plan',
            'Working hours and permits',
            'Environmental considerations',
            'Housekeeping standards'
          ]}
        ]},
        { id: 'declaration', title: 'Declaration', fields: [
          { name: 'inducteeSignature', label: 'Inductee Signature', type: 'signature', required: true },
          { name: 'inductorSignature', label: 'Inductor Signature', type: 'signature', required: true }
        ]}
      ]
    }
  },
  {
    name: 'Permit to Work - General',
    description: 'General permit to work template for controlled activities',
    category: 'PERMIT_TO_WORK',
    tags: ['safety', 'permit', 'compliance'],
    content: {
      title: 'Permit to Work',
      version: '1.0',
      sections: [
        { id: 'permit_info', title: 'Permit Details', fields: [
          { name: 'permitNumber', label: 'Permit Number', type: 'text', required: true },
          { name: 'workType', label: 'Type of Work', type: 'select', options: ['Hot Work', 'Confined Space', 'Electrical', 'Working at Height', 'Excavation', 'Other'], required: true },
          { name: 'location', label: 'Location', type: 'text', required: true },
          { name: 'startDateTime', label: 'Start Date/Time', type: 'datetime', required: true },
          { name: 'endDateTime', label: 'End Date/Time', type: 'datetime', required: true }
        ]},
        { id: 'work_details', title: 'Work Details', fields: [
          { name: 'description', label: 'Description of Work', type: 'textarea', required: true },
          { name: 'contractor', label: 'Contractor/Person Carrying Out Work', type: 'text', required: true }
        ]},
        { id: 'precautions', title: 'Precautions Required', fields: [
          { name: 'hazards', label: 'Identified Hazards', type: 'textarea', required: true },
          { name: 'precautions', label: 'Control Measures', type: 'textarea', required: true },
          { name: 'ppe', label: 'PPE Required', type: 'checklist', options: ['Hard hat', 'Safety boots', 'Hi-vis', 'Gloves', 'Eye protection', 'Hearing protection', 'Respiratory protection', 'Harness'] }
        ]},
        { id: 'authorization', title: 'Authorization', fields: [
          { name: 'issuedBy', label: 'Issued By', type: 'signature', required: true },
          { name: 'acceptedBy', label: 'Accepted By (Contractor)', type: 'signature', required: true }
        ]},
        { id: 'completion', title: 'Permit Closure', fields: [
          { name: 'workCompleted', label: 'Work Completed', type: 'checkbox' },
          { name: 'areaSafe', label: 'Area Left Safe', type: 'checkbox' },
          { name: 'closedBy', label: 'Closed By', type: 'signature', required: false }
        ]}
      ]
    }
  },
  {
    name: 'Quality Inspection Checklist',
    description: 'Standard quality inspection checklist for construction works',
    category: 'INSPECTION_FORM',
    tags: ['quality', 'inspection', 'compliance'],
    content: {
      title: 'Quality Inspection Checklist',
      version: '1.0',
      sections: [
        { id: 'inspection_info', title: 'Inspection Details', fields: [
          { name: 'inspectionNumber', label: 'Inspection Number', type: 'text', required: true },
          { name: 'workElement', label: 'Work Element', type: 'text', required: true },
          { name: 'location', label: 'Location', type: 'text', required: true },
          { name: 'inspector', label: 'Inspector', type: 'text', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true }
        ]},
        { id: 'checklist', title: 'Inspection Items', fields: [
          { name: 'items', label: 'Inspection Checklist', type: 'inspection_checklist', columns: ['Item', 'Pass', 'Fail', 'N/A', 'Comments'] }
        ]},
        { id: 'defects', title: 'Defects Identified', fields: [
          { name: 'defects', label: 'Defect List', type: 'textarea', required: false }
        ]},
        { id: 'result', title: 'Inspection Result', fields: [
          { name: 'result', label: 'Overall Result', type: 'select', options: ['Pass', 'Pass with Conditions', 'Fail', 'Reinspection Required'], required: true },
          { name: 'comments', label: 'Additional Comments', type: 'textarea', required: false }
        ]},
        { id: 'signatures', title: 'Sign-Off', fields: [
          { name: 'inspectorSignature', label: 'Inspector Signature', type: 'signature', required: true },
          { name: 'supervisorSignature', label: 'Supervisor Acknowledgement', type: 'signature', required: false }
        ]}
      ]
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeSystem = searchParams.get('includeSystem') !== 'false';

    const where: any = {
      OR: [
        { organizationId: session.user.organizationId },
        ...(includeSystem ? [{ isSystemTemplate: true }] : [])
      ],
      isActive: true
    };
    
    if (category && category !== 'all') {
      where.category = category;
    }

    const templates = await prisma.documentTemplate.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: [{ isSystemTemplate: 'desc' }, { usageCount: 'desc' }, { createdAt: 'desc' }]
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Check if this is a request to seed system templates
    if (data.seedSystemTemplates) {
      // Only super admins can seed system templates
      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const created: any[] = [];
      for (const template of SYSTEM_TEMPLATES) {
        const existing = await prisma.documentTemplate.findFirst({
          where: { name: template.name, isSystemTemplate: true }
        });
        
        if (!existing) {
          const newTemplate = await prisma.documentTemplate.create({
            data: {
              name: template.name,
              description: template.description,
              category: template.category as any,
              content: template.content,
              tags: template.tags,
              isSystemTemplate: true,
              isActive: true
            }
          });
          created.push(newTemplate);
        }
      }

      return NextResponse.json({ created: created.length, templates: created });
    }

    // Create custom template
    const template = await prisma.documentTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category || 'OTHER',
        content: data.content || {},
        tags: data.tags || [],
        organizationId: session.user.organizationId!,
        createdById: session.user.id,
        isSystemTemplate: false,
        isActive: true
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
