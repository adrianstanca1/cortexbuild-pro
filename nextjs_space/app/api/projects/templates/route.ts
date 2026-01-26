import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export const dynamic = 'force-dynamic';

// Predefined construction project templates
const DEFAULT_TEMPLATES = [
  {
    name: 'Commercial Building',
    description: 'Standard commercial construction project template',
    category: 'commercial',
    phases: [
      { name: 'Pre-Construction', duration: 30, tasks: ['Site Survey', 'Permits & Approvals', 'Design Review', 'Contractor Selection'] },
      { name: 'Foundation', duration: 45, tasks: ['Excavation', 'Foundation Footings', 'Concrete Pour', 'Waterproofing'] },
      { name: 'Structural', duration: 90, tasks: ['Steel Erection', 'Concrete Deck', 'Structural Inspections', 'Fire Proofing'] },
      { name: 'Envelope', duration: 60, tasks: ['Exterior Walls', 'Roofing', 'Windows & Glazing', 'Waterproofing'] },
      { name: 'MEP Rough-In', duration: 60, tasks: ['Electrical Rough', 'Plumbing Rough', 'HVAC Installation', 'Fire Protection'] },
      { name: 'Interior Finishes', duration: 45, tasks: ['Drywall', 'Flooring', 'Ceiling', 'Painting'] },
      { name: 'Closeout', duration: 30, tasks: ['Punch List', 'Final Inspections', 'Commissioning', 'Handover'] }
    ]
  },
  {
    name: 'Residential Development',
    description: 'Multi-unit residential development template',
    category: 'residential',
    phases: [
      { name: 'Site Preparation', duration: 21, tasks: ['Site Clearing', 'Grading', 'Utilities Connection', 'Foundation Layout'] },
      { name: 'Foundation', duration: 28, tasks: ['Excavation', 'Footings', 'Foundation Walls', 'Backfill'] },
      { name: 'Framing', duration: 35, tasks: ['Floor Framing', 'Wall Framing', 'Roof Framing', 'Sheathing'] },
      { name: 'Rough-Ins', duration: 28, tasks: ['Electrical', 'Plumbing', 'HVAC', 'Insulation'] },
      { name: 'Exterior', duration: 21, tasks: ['Siding', 'Roofing', 'Windows', 'Doors'] },
      { name: 'Interior Finishes', duration: 35, tasks: ['Drywall', 'Trim', 'Cabinets', 'Flooring'] },
      { name: 'Final', duration: 14, tasks: ['Paint', 'Fixtures', 'Landscaping', 'Final Inspection'] }
    ]
  },
  {
    name: 'Infrastructure Project',
    description: 'Roads, bridges, and civil infrastructure template',
    category: 'infrastructure',
    phases: [
      { name: 'Planning', duration: 60, tasks: ['Environmental Assessment', 'Survey', 'Design Approval', 'Permits'] },
      { name: 'Site Work', duration: 45, tasks: ['Clearing', 'Earthwork', 'Drainage', 'Utility Relocation'] },
      { name: 'Subgrade', duration: 30, tasks: ['Grading', 'Compaction', 'Subbase Installation', 'Testing'] },
      { name: 'Paving/Structure', duration: 60, tasks: ['Base Course', 'Surface Course', 'Curbs', 'Markings'] },
      { name: 'Finishing', duration: 30, tasks: ['Signage', 'Barriers', 'Landscaping', 'Final Inspection'] }
    ]
  },
  {
    name: 'Renovation Project',
    description: 'Building renovation and refurbishment template',
    category: 'renovation',
    phases: [
      { name: 'Assessment', duration: 14, tasks: ['Building Survey', 'Hazmat Assessment', 'Structural Review', 'MEP Audit'] },
      { name: 'Demolition', duration: 21, tasks: ['Soft Demo', 'Hazmat Abatement', 'Structural Demo', 'Debris Removal'] },
      { name: 'Structural Repairs', duration: 28, tasks: ['Foundation Repairs', 'Framing', 'Structural Steel', 'Concrete Repairs'] },
      { name: 'MEP Upgrade', duration: 35, tasks: ['Electrical Upgrade', 'Plumbing', 'HVAC', 'Fire Protection'] },
      { name: 'Finishes', duration: 28, tasks: ['Walls', 'Ceilings', 'Flooring', 'Fixtures'] },
      { name: 'Closeout', duration: 14, tasks: ['Punch List', 'Testing', 'Documentation', 'Handover'] }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return predefined templates and any custom templates from the organization
    // For now, just return predefined templates
    return NextResponse.json({ templates: DEFAULT_TEMPLATES });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// Create a project from a template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; name?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const body = await request.json();
    const { templateName, projectName, startDate, budget, location, clientName, description } = body;

    // Find the template
    const template = DEFAULT_TEMPLATES.find(t => t.name === templateName);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Calculate project dates based on template phases
    const projectStartDate = startDate ? new Date(startDate) : new Date();
    let totalDuration = template.phases.reduce((sum, p) => sum + p.duration, 0);
    const projectEndDate = new Date(projectStartDate);
    projectEndDate.setDate(projectEndDate.getDate() + totalDuration);

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: projectName || `${template.name} Project`,
        description: description || template.description,
        status: 'PLANNING',
        startDate: projectStartDate,
        endDate: projectEndDate,
        budget: parseFloat(budget) || 0,
        location: location || '',
        clientName: clientName || '',
        organizationId: user.organizationId,
        managerId: user.id
      }
    });

    // Create tasks from template phases - batch all task data first, then createMany
    let currentDate = new Date(projectStartDate);
    const tasksData = [];

    for (const phase of template.phases) {
      for (const taskName of phase.tasks) {
        const taskEndDate = new Date(currentDate);
        taskEndDate.setDate(taskEndDate.getDate() + Math.ceil(phase.duration / phase.tasks.length));
        
        tasksData.push({
          title: `${phase.name}: ${taskName}`,
          description: `Task from ${template.name} template - ${phase.name} phase`,
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: project.id,
          dueDate: taskEndDate,
          creatorId: user.id
        });
      }
      currentDate.setDate(currentDate.getDate() + phase.duration);
    }

    // Bulk insert all tasks at once - much faster than individual creates
    await prisma.task.createMany({
      data: tasksData,
      skipDuplicates: true
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'project_created_from_template',
        entityType: 'Project',
        entityId: project.id,
        entityName: project.name,
        details: `Created project from "${template.name}" template with ${tasksData.length} tasks`,
        userId: user.id,
        projectId: project.id
      }
    });

    // Broadcast event
    broadcastToOrganization(user.organizationId, {
      type: 'project_created',
      data: { project, template: template.name, tasksCreated: createdTasks.length }
    });

    return NextResponse.json({
      project,
      tasksCreated: createdTasks.length,
      message: `Project created successfully with ${createdTasks.length} tasks from ${template.name} template`
    });
  } catch (error) {
    console.error('Error creating project from template:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
