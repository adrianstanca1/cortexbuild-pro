import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seeds the database with default organizations, users, team members, projects, tasks, and activity logs.
 *
 * Creates a default organization and an additional organization, upserts platform and company admin accounts (including team member records), generates sample projects and tasks, assigns team members to projects, inserts activity logs, and logs progress and example credentials to the console.
 */
async function main() {
  console.log("Seeding database...");

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: "CortexBuild Demo",
      slug: "default"
    }
  });
  console.log("Organization created:", org.name);

  // =====================
  // SUPERADMIN USER - Platform-wide access
  // =====================
  const superadminPassword = await bcrypt.hash("Cumparavinde1", 12);
  const superadminUser = await prisma.user.upsert({
    where: { email: "adrian.stanca1@gmail.com" },
    update: {
      password: superadminPassword,
      role: "SUPER_ADMIN"
    },
    create: {
      email: "adrian.stanca1@gmail.com",
      password: superadminPassword,
      name: "Adrian Stanca",
      role: "SUPER_ADMIN",
      organizationId: org.id
    }
  });
  console.log("Superadmin user created:", superadminUser.email);

  // Create team member for superadmin
  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: superadminUser.id, organizationId: org.id } },
    update: {},
    create: {
      userId: superadminUser.id,
      organizationId: org.id,
      jobTitle: "Platform Superadmin"
    }
  });

  // =====================
  // AS CLADDING LTD ORGANIZATION & COMPANY OWNER
  // =====================
  const asCladdingOrg = await prisma.organization.upsert({
    where: { slug: "as-cladding-ltd" },
    update: {},
    create: {
      name: "AS Cladding Ltd",
      slug: "as-cladding-ltd"
    }
  });
  console.log("Organization created:", asCladdingOrg.name);

  const companyOwnerPassword = await bcrypt.hash("Cumparavinde1", 12);
  const companyOwner = await prisma.user.upsert({
    where: { email: "adrian@ascladdingltd.co.uk" },
    update: {
      password: companyOwnerPassword,
      role: "COMPANY_OWNER",
      organizationId: asCladdingOrg.id
    },
    create: {
      email: "adrian@ascladdingltd.co.uk",
      password: companyOwnerPassword,
      name: "adrian stanca",
      role: "COMPANY_OWNER",
      organizationId: asCladdingOrg.id
    }
  });
  console.log("Company Owner created:", companyOwner.email);

  // Create team member for company owner
  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: companyOwner.id, organizationId: asCladdingOrg.id } },
    update: {},
    create: {
      userId: companyOwner.id,
      organizationId: asCladdingOrg.id,
      jobTitle: "Company Owner / Director"
    }
  });

  // =====================
  // DEMO ADMIN USER (test account)
  // =====================
  const hashedPassword = await bcrypt.hash("johndoe123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "john@doe.com" },
    update: {},
    create: {
      email: "john@doe.com",
      password: hashedPassword,
      name: "John Doe",
      role: "ADMIN",
      organizationId: org.id
    }
  });
  console.log("Admin user created:", adminUser.email);

  // Create team member for admin
  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: adminUser.id, organizationId: org.id } },
    update: {},
    create: {
      userId: adminUser.id,
      organizationId: org.id,
      jobTitle: "Administrator"
    }
  });

  // Create project manager
  const pmPassword = await bcrypt.hash("manager123", 12);
  const pmUser = await prisma.user.upsert({
    where: { email: "sarah@cortexbuild.com" },
    update: {},
    create: {
      email: "sarah@cortexbuild.com",
      password: pmPassword,
      name: "Sarah Johnson",
      role: "PROJECT_MANAGER",
      organizationId: org.id
    }
  });
  console.log("Project Manager created:", pmUser.email);

  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: pmUser.id, organizationId: org.id } },
    update: {},
    create: {
      userId: pmUser.id,
      organizationId: org.id,
      jobTitle: "Senior Project Manager"
    }
  });

  // Create field worker
  const fwPassword = await bcrypt.hash("worker123", 12);
  const fwUser = await prisma.user.upsert({
    where: { email: "mike@cortexbuild.com" },
    update: {},
    create: {
      email: "mike@cortexbuild.com",
      password: fwPassword,
      name: "Mike Wilson",
      role: "FIELD_WORKER",
      organizationId: org.id
    }
  });
  console.log("Field Worker created:", fwUser.email);

  const fwTeamMember = await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: fwUser.id, organizationId: org.id } },
    update: {},
    create: {
      userId: fwUser.id,
      organizationId: org.id,
      jobTitle: "Site Supervisor"
    }
  });

  // Create sample projects
  const project1 = await prisma.project.upsert({
    where: { id: "project-downtown-office" },
    update: {},
    create: {
      id: "project-downtown-office",
      name: "Downtown Office Complex",
      description: "A 20-story commercial office building in the heart of downtown with modern amenities and LEED certification.",
      status: "IN_PROGRESS",
      location: "123 Main Street, Downtown",
      clientName: "Apex Developments",
      clientEmail: "contact@apexdev.com",
      budget: 15000000,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2027-06-01"),
      organizationId: org.id,
      managerId: pmUser.id
    }
  });
  console.log("Project created:", project1.name);

  const project2 = await prisma.project.upsert({
    where: { id: "project-riverside-homes" },
    update: {},
    create: {
      id: "project-riverside-homes",
      name: "Riverside Residential Development",
      description: "Luxury residential community featuring 50 single-family homes with river views.",
      status: "PLANNING",
      location: "456 River Road, Suburbs",
      clientName: "HomeBuilders Inc",
      clientEmail: "projects@homebuilders.com",
      budget: 25000000,
      startDate: new Date("2026-01-15"),
      endDate: new Date("2028-01-15"),
      organizationId: org.id,
      managerId: adminUser.id
    }
  });
  console.log("Project created:", project2.name);

  const project3 = await prisma.project.upsert({
    where: { id: "project-mall-renovation" },
    update: {},
    create: {
      id: "project-mall-renovation",
      name: "Central Mall Renovation",
      description: "Complete renovation and modernization of the central shopping mall including new facade and interior upgrades.",
      status: "ON_HOLD",
      location: "789 Shopping Lane",
      clientName: "Retail Properties LLC",
      budget: 8500000,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-09-01"),
      organizationId: org.id,
      managerId: pmUser.id
    }
  });
  console.log("Project created:", project3.name);

  // Assign team member to project
  await prisma.projectTeamMember.upsert({
    where: { projectId_teamMemberId: { projectId: project1.id, teamMemberId: fwTeamMember.id } },
    update: {},
    create: {
      projectId: project1.id,
      teamMemberId: fwTeamMember.id
    }
  });

  // Create sample tasks for project 1
  const tasks = [
    { title: "Site survey and assessment", status: "COMPLETE", priority: "HIGH", description: "Complete initial site survey" },
    { title: "Foundation excavation", status: "IN_PROGRESS", priority: "CRITICAL", description: "Excavate foundation area" },
    { title: "Steel framework installation", status: "TODO", priority: "HIGH", description: "Install main steel framework" },
    { title: "Electrical rough-in", status: "TODO", priority: "MEDIUM", description: "Complete electrical wiring" },
    { title: "Plumbing installation", status: "TODO", priority: "MEDIUM", description: "Install plumbing systems" },
    { title: "HVAC system setup", status: "TODO", priority: "LOW", description: "Install HVAC systems" },
    { title: "Interior finishing", status: "TODO", priority: "LOW", description: "Complete interior work" },
    { title: "Safety inspection", status: "REVIEW", priority: "CRITICAL", description: "Conduct safety audit" }
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status as any,
        priority: task.priority as any,
        projectId: project1.id,
        assigneeId: fwUser.id,
        creatorId: pmUser.id,
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
    });
  }
  console.log("Tasks created for project:", project1.name);

  // Create tasks for project 2
  const project2Tasks = [
    { title: "Zoning approval", status: "IN_PROGRESS", priority: "CRITICAL" },
    { title: "Environmental impact study", status: "TODO", priority: "HIGH" },
    { title: "Architectural design review", status: "COMPLETE", priority: "HIGH" }
  ];

  for (const task of project2Tasks) {
    await prisma.task.create({
      data: {
        title: task.title,
        status: task.status as any,
        priority: task.priority as any,
        projectId: project2.id,
        creatorId: adminUser.id,
        dueDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000)
      }
    });
  }
  console.log("Tasks created for project:", project2.name);

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      { action: "created project", entityType: "Project", entityId: project1.id, entityName: project1.name, userId: pmUser.id, projectId: project1.id },
      { action: "created project", entityType: "Project", entityId: project2.id, entityName: project2.name, userId: adminUser.id, projectId: project2.id },
      { action: "updated task status", entityType: "Task", entityName: "Site survey and assessment", userId: fwUser.id, projectId: project1.id },
      { action: "added team member", entityType: "TeamMember", entityName: "Mike Wilson", userId: pmUser.id, projectId: project1.id }
    ]
  });
  console.log("Activity logs created");

  console.log("\nDatabase seeding completed!");
  console.log("\n=== USER ACCOUNTS ===");
  console.log("\n** SUPERADMIN (Full Platform Access) **");
  console.log("  Email: adrian.stanca1@gmail.com");
  console.log("  Password: Cumparavinde1");
  console.log("\n** COMPANY OWNER (AS Cladding Ltd) **");
  console.log("  Email: adrian@ascladdingltd.co.uk");
  console.log("  Password: Cumparavinde1");
  console.log("\n** DEMO ACCOUNTS (CortexBuild Demo Org) **");
  console.log("  Admin: john@doe.com / johndoe123");
  console.log("  Project Manager: sarah@cortexbuild.com / manager123");
  console.log("  Field Worker: mike@cortexbuild.com / worker123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });