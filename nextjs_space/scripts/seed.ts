import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = process.env.SEED_PASSWORD;
if (!SEED_PASSWORD) {
  console.error("❌ SEED_PASSWORD environment variable is required.");
  console.error("   Usage: SEED_PASSWORD=YourPassword npx tsx scripts/seed.ts");
  process.exit(1);
}

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
  const superadminPassword = await bcrypt.hash(SEED_PASSWORD, 12);
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

  const companyOwnerPassword = await bcrypt.hash(SEED_PASSWORD, 12);
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
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 12);
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
  const pmPassword = await bcrypt.hash(SEED_PASSWORD, 12);
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
  const fwPassword = await bcrypt.hash(SEED_PASSWORD, 12);
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

  // =====================
  // ENTERPRISE FEATURES DATA
  // =====================

  // Create Cost Codes (Organization-wide)
  type CostCodeInput = { code: string; name: string; category: string; budgetAmount: number; parentCode?: string };
  const costCodes: CostCodeInput[] = [
    { code: "01-000", name: "General Requirements", category: "OVERHEAD", budgetAmount: 50000 },
    { code: "01-100", name: "Project Management", category: "OVERHEAD", budgetAmount: 75000, parentCode: "01-000" },
    { code: "01-200", name: "Site Supervision", category: "OVERHEAD", budgetAmount: 45000, parentCode: "01-000" },
    { code: "02-000", name: "Site Construction", category: "OTHER", budgetAmount: 150000 },
    { code: "02-100", name: "Earthwork", category: "OTHER", budgetAmount: 80000, parentCode: "02-000" },
    { code: "02-200", name: "Site Utilities", category: "UTILITIES", budgetAmount: 70000, parentCode: "02-000" },
    { code: "03-000", name: "Concrete", category: "MATERIALS", budgetAmount: 200000 },
    { code: "03-100", name: "Foundations", category: "MATERIALS", budgetAmount: 120000, parentCode: "03-000" },
    { code: "03-200", name: "Structural Concrete", category: "MATERIALS", budgetAmount: 80000, parentCode: "03-000" },
    { code: "04-000", name: "Masonry", category: "MATERIALS", budgetAmount: 60000 },
    { code: "05-000", name: "Metals", category: "MATERIALS", budgetAmount: 180000 },
    { code: "05-100", name: "Structural Steel", category: "MATERIALS", budgetAmount: 130000, parentCode: "05-000" },
    { code: "05-200", name: "Metal Fabrications", category: "MATERIALS", budgetAmount: 50000, parentCode: "05-000" },
    { code: "06-000", name: "Wood & Plastics", category: "MATERIALS", budgetAmount: 40000 },
    { code: "07-000", name: "Thermal & Moisture Protection", category: "MATERIALS", budgetAmount: 90000 },
    { code: "08-000", name: "Doors & Windows", category: "MATERIALS", budgetAmount: 55000 },
    { code: "09-000", name: "Finishes", category: "MATERIALS", budgetAmount: 120000 },
    { code: "15-000", name: "Mechanical", category: "EQUIPMENT", budgetAmount: 250000 },
    { code: "16-000", name: "Electrical", category: "EQUIPMENT", budgetAmount: 200000 }
  ];

  const costCodeMap: Record<string, string> = {};
  for (const cc of costCodes) {
    const parentId = cc.parentCode ? costCodeMap[cc.parentCode] : null;
    // Check if cost code already exists
    const existing = await prisma.costCode.findFirst({
      where: { code: cc.code, organizationId: org.id, projectId: null }
    });
    if (existing) {
      costCodeMap[cc.code] = existing.id;
    } else {
      const created = await prisma.costCode.create({
        data: {
          code: cc.code,
          name: cc.name,
          category: cc.category as any,
          budgetAmount: cc.budgetAmount,
          organizationId: org.id,
          parentId: parentId
        }
      });
      costCodeMap[cc.code] = created.id;
    }
  }
  console.log("Cost codes created:", Object.keys(costCodeMap).length);

  // Create Work Packages for project 1
  const workPackages = [
    { 
      number: 1,
      name: "Groundworks Package", 
      scope: "Complete groundworks including excavation, foundations, and drainage",
      status: "IN_PROGRESS",
      budgetAmount: 280000,
      actualAmount: 145000,
      percentComplete: 52,
      plannedStart: new Date("2025-01-15"),
      plannedEnd: new Date("2025-03-31"),
      isCriticalPath: true
    },
    { 
      number: 2,
      name: "Structural Steel Frame", 
      scope: "Design, fabrication and erection of primary steel frame",
      status: "DRAFT",
      budgetAmount: 450000,
      actualAmount: 0,
      percentComplete: 0,
      plannedStart: new Date("2025-04-01"),
      plannedEnd: new Date("2025-06-30"),
      isCriticalPath: true
    },
    { 
      number: 3,
      name: "External Envelope", 
      scope: "Cladding, glazing, roofing and weatherproofing systems",
      status: "DRAFT",
      budgetAmount: 380000,
      actualAmount: 0,
      percentComplete: 0,
      plannedStart: new Date("2025-07-01"),
      plannedEnd: new Date("2025-09-30"),
      isCriticalPath: false
    },
    { 
      number: 4,
      name: "M&E First Fix", 
      scope: "Mechanical and electrical rough-in installations",
      status: "DRAFT",
      budgetAmount: 320000,
      actualAmount: 0,
      percentComplete: 0,
      plannedStart: new Date("2025-08-01"),
      plannedEnd: new Date("2025-11-30"),
      isCriticalPath: false
    },
    { 
      number: 5,
      name: "Fit-Out & Finishes", 
      scope: "Internal partitions, ceilings, flooring and decorative finishes",
      status: "DRAFT",
      budgetAmount: 290000,
      actualAmount: 0,
      percentComplete: 0,
      plannedStart: new Date("2025-10-01"),
      plannedEnd: new Date("2026-01-31"),
      isCriticalPath: false
    }
  ];

  for (const wp of workPackages) {
    const existing = await prisma.workPackage.findFirst({
      where: { projectId: project1.id, number: wp.number }
    });
    if (!existing) {
      await prisma.workPackage.create({
        data: {
          number: wp.number,
          name: wp.name,
          scope: wp.scope,
          status: wp.status as any,
          budgetAmount: wp.budgetAmount,
          actualAmount: wp.actualAmount,
          percentComplete: wp.percentComplete,
          plannedStartDate: wp.plannedStart,
          plannedEndDate: wp.plannedEnd,
          isCriticalPath: wp.isCriticalPath,
          projectId: project1.id,
          createdById: pmUser.id
        }
      });
    }
  }
  console.log("Work packages created:", workPackages.length);

  // Create Forecast Entries for project 1
  const forecasts = [
    {
      forecastDate: new Date("2025-01-31"),
      forecastType: "COST",
      originalBudget: 1720000,
      currentBudget: 1720000,
      actualToDate: 175000,
      forecastAtCompletion: 1670000,
      estimateToComplete: 1495000,
      varianceAtCompletion: 50000,
      plannedValue: 200000,
      earnedValue: 180000,
      actualCost: 175000,
      costPerformanceIndex: 1.03,
      schedulePerformanceIndex: 0.90,
      assumptions: "Slight delay due to adverse weather, but cost performance remains strong"
    },
    {
      forecastDate: new Date("2025-02-28"),
      forecastType: "COST",
      originalBudget: 1720000,
      currentBudget: 1720000,
      actualToDate: 310000,
      forecastAtCompletion: 1670000,
      estimateToComplete: 1360000,
      varianceAtCompletion: 50000,
      plannedValue: 380000,
      earnedValue: 320000,
      actualCost: 310000,
      costPerformanceIndex: 1.03,
      schedulePerformanceIndex: 0.84,
      assumptions: "Schedule recovery plan implemented, additional resources mobilised"
    }
  ];

  for (const fc of forecasts) {
    await prisma.forecastEntry.create({
      data: {
        ...fc,
        projectId: project1.id,
        createdById: pmUser.id
      }
    });
  }
  console.log("Forecast entries created:", forecasts.length);

  // Create Risk Register Entries for project 1
  const risks = [
    {
      number: 1,
      title: "Ground Conditions Risk",
      description: "Unforeseen ground conditions may require additional foundation works",
      category: "TECHNICAL",
      probability: 3,
      impact: 4,
      riskScore: 12,
      riskLevel: "HIGH",
      status: "OPEN",
      responseStrategy: "MITIGATE",
      mitigationPlan: "Complete detailed geotechnical survey before foundation design finalisation",
      costImpactMostLikely: 75000,
      scheduleImpactDays: 14
    },
    {
      number: 2,
      title: "Material Supply Chain Delays",
      description: "Steel and cladding materials subject to extended lead times",
      category: "SUPPLY_CHAIN",
      probability: 4,
      impact: 3,
      riskScore: 12,
      riskLevel: "HIGH",
      status: "MITIGATING",
      responseStrategy: "MITIGATE",
      mitigationPlan: "Early procurement of long-lead items, establish backup suppliers",
      costImpactMostLikely: 45000,
      scheduleImpactDays: 21
    },
    {
      number: 3,
      title: "Labour Shortage",
      description: "Skilled trades shortage in the region may impact programme",
      category: "RESOURCE",
      probability: 3,
      impact: 3,
      riskScore: 9,
      riskLevel: "MEDIUM",
      status: "OPEN",
      responseStrategy: "MITIGATE",
      mitigationPlan: "Engage multiple subcontractors, consider off-site fabrication",
      costImpactMostLikely: 35000,
      scheduleImpactDays: 10
    },
    {
      number: 4,
      title: "Planning Condition Compliance",
      description: "Risk of delays in discharging planning conditions",
      category: "REGULATORY",
      probability: 2,
      impact: 4,
      riskScore: 8,
      riskLevel: "MEDIUM",
      status: "OPEN",
      responseStrategy: "AVOID",
      mitigationPlan: "Early engagement with local authority, dedicated planning consultant",
      costImpactMostLikely: 15000,
      scheduleImpactDays: 28
    },
    {
      number: 5,
      title: "Adverse Weather Impact",
      description: "Winter working may impact external works and concrete pours",
      category: "ENVIRONMENTAL",
      probability: 4,
      impact: 2,
      riskScore: 8,
      riskLevel: "MEDIUM",
      status: "OPEN",
      responseStrategy: "ACCEPT",
      mitigationPlan: "Build weather contingency into programme, use frost protection for concrete",
      costImpactMostLikely: 25000,
      scheduleImpactDays: 7
    },
    {
      number: 6,
      title: "Design Coordination Errors",
      description: "Potential clashes between structural and M&E designs",
      category: "DESIGN",
      probability: 2,
      impact: 3,
      riskScore: 6,
      riskLevel: "MEDIUM",
      status: "MITIGATING",
      responseStrategy: "MITIGATE",
      mitigationPlan: "Regular BIM coordination meetings, clash detection protocols",
      costImpactMostLikely: 30000,
      scheduleImpactDays: 5
    }
  ];

  for (const risk of risks) {
    const existing = await prisma.riskRegisterEntry.findFirst({
      where: { projectId: project1.id, number: risk.number }
    });
    if (!existing) {
      await prisma.riskRegisterEntry.create({
        data: {
          ...risk,
          projectId: project1.id,
          ownerId: pmUser.id,
          createdById: pmUser.id
        }
      });
    }
  }
  console.log("Risk register entries created:", risks.length);

  // Create Automation Rule (Organization-wide)
  const existingRule = await prisma.automationRule.findFirst({
    where: { name: "High Risk Auto-Escalation", organizationId: org.id }
  });
  if (!existingRule) {
    await prisma.automationRule.create({
      data: {
        name: "High Risk Auto-Escalation",
        description: "Automatically escalate risks rated as CRITICAL to senior management",
        triggerType: "THRESHOLD",
        triggerCondition: { field: "riskLevel", operator: "=", value: "CRITICAL" },
        actions: [{ 
          type: "NOTIFY",
          recipients: ["role:ADMIN", "role:PROJECT_MANAGER"],
          message: "Critical risk identified - immediate attention required"
        }],
        notifyRoles: ["ADMIN", "PROJECT_MANAGER"],
        isActive: true,
        organizationId: org.id,
        createdById: adminUser.id
      }
    });
  }
  console.log("Automation rules created");

  // Create Predictive Signals
  const signals = [
    {
      signalType: "SCHEDULE_SLIP",
      signalName: "Schedule Slippage Warning",
      description: "SPI trending below 0.9 for 3 consecutive weeks",
      severity: "HIGH",
      confidence: 0.85,
      potentialImpact: "Project may miss key milestone by 2-3 weeks",
      recommendations: ["Review critical path activities", "Consider resource augmentation"]
    },
    {
      signalType: "COST_OVERRUN",
      signalName: "Cost Trend Alert",
      description: "Groundworks package trending 5% over budget",
      severity: "MEDIUM",
      confidence: 0.72,
      potentialImpact: "Potential £15k overrun on groundworks",
      recommendations: ["Review remaining scope", "Identify value engineering opportunities"]
    }
  ];

  for (const signal of signals) {
    const existing = await prisma.predictiveSignal.findFirst({
      where: { signalName: signal.signalName, projectId: project1.id }
    });
    if (!existing) {
      await prisma.predictiveSignal.create({
        data: {
          ...signal,
          projectId: project1.id,
          organizationId: org.id,
          detectedAt: new Date()
        }
      });
    }
  }
  console.log("Predictive signals created:", signals.length);

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

  // =====================
  // API CONNECTIONS - Enterprise Integrations
  // =====================
  console.log("\nSeeding API Connections...");

  const apiConnections = [
    {
      name: "Ollama Local LLM",
      serviceName: "ollama",
      description: "Local LLM inference for AI-powered features including document analysis, risk prediction, and intelligent insights",
      type: "INTERNAL" as const,
      environment: "PRODUCTION" as const,
      category: "AI_PROCESSING" as const,
      purpose: "Powers AI Assistant, Document Generator, Photo Analysis, and Predictive Analytics using local models",
      baseUrl: process.env.OLLAMA_URL || "http://localhost:11434",
      version: "latest",
      status: "ACTIVE" as const,
      dependentModules: ["ai-insights", "document-generator", "photo-analysis", "predictive-signals", "risk-assessment"],
      credentials: JSON.stringify({ endpoint: process.env.OLLAMA_URL || "http://localhost:11434" }),
      configSchema: JSON.stringify({
        type: "object",
        properties: {
          endpoint: { type: "string", description: "Ollama API endpoint URL" },
          model: { type: "string", description: "Default model to use (e.g., llama3.2, qwen2.5)" }
        },
        required: ["endpoint"]
      })
    },
    {
      name: "Open-Meteo Weather API",
      serviceName: "open-meteo",
      description: "Real-time weather data for construction site planning and safety alerts",
      type: "EXTERNAL" as const,
      environment: "PRODUCTION" as const,
      category: "OTHER" as const,
      purpose: "Weather forecasting for project scheduling and safety planning",
      baseUrl: "https://api.open-meteo.com/v1",
      version: "v1",
      status: "ACTIVE" as const,
      dependentModules: ["weather-widget", "forecasting", "daily-reports"],
      credentials: JSON.stringify({ apiKey: "free-tier" }),
      configSchema: JSON.stringify({
        type: "object",
        properties: {
          latitude: { type: "number" },
          longitude: { type: "number" }
        }
      })
    },
    {
      name: "Internal Real-time SSE",
      serviceName: "realtime-sse",
      description: "Server-Sent Events for real-time collaboration and live updates",
      type: "INTERNAL" as const,
      environment: "PRODUCTION" as const,
      category: "COMMUNICATION" as const,
      purpose: "Real-time notifications, task updates, and collaborative editing",
      baseUrl: "/api/realtime",
      version: "v1",
      status: "ACTIVE" as const,
      dependentModules: ["notifications", "tasks", "drawings", "team"],
      credentials: JSON.stringify({ type: "session-auth" }),
      configSchema: JSON.stringify({})
    },
    {
      name: "NextAuth Authentication",
      serviceName: "nextauth",
      description: "Secure authentication and session management",
      type: "INTERNAL" as const,
      environment: "PRODUCTION" as const,
      category: "AUTHENTICATION" as const,
      purpose: "User authentication, session management, and access control",
      baseUrl: "/api/auth",
      version: "v4",
      status: "ACTIVE" as const,
      dependentModules: ["login", "signup", "session", "middleware"],
      credentials: JSON.stringify({ secret: "configured-via-env" }),
      configSchema: JSON.stringify({
        type: "object",
        properties: {
          NEXTAUTH_SECRET: { type: "string" },
          NEXTAUTH_URL: { type: "string" }
        },
        required: ["NEXTAUTH_SECRET", "NEXTAUTH_URL"]
      })
    },
    {
      name: "PostgreSQL Database",
      serviceName: "postgresql",
      description: "Primary data store with Prisma ORM",
      type: "INTERNAL" as const,
      environment: "PRODUCTION" as const,
      category: "OTHER" as const,
      purpose: "Persistent storage for all application data",
      baseUrl: "postgresql://db:5432/cortexbuild",
      version: "15",
      status: "ACTIVE" as const,
      dependentModules: ["all"],
      credentials: JSON.stringify({ connectionString: "configured-via-env" }),
      configSchema: JSON.stringify({
        type: "object",
        properties: {
          DATABASE_URL: { type: "string" }
        },
        required: ["DATABASE_URL"]
      })
    },
    {
      name: "Drawing Annotation WebSocket",
      serviceName: "drawing-websocket",
      description: "Real-time collaborative drawing annotations",
      type: "INTERNAL" as const,
      environment: "PRODUCTION" as const,
      category: "COMMUNICATION" as const,
      purpose: "Live cursor tracking and annotation sync for drawings",
      baseUrl: "/api/drawings/[id]/presence",
      version: "v1",
      status: "ACTIVE" as const,
      dependentModules: ["drawings", "annotations"],
      credentials: JSON.stringify({ type: "session-auth" }),
      configSchema: JSON.stringify({})
    },
    {
      name: "SendGrid Email Service",
      serviceName: "sendgrid",
      description: "Transactional email delivery for notifications, invitations, and alerts",
      type: "EXTERNAL" as const,
      environment: "PRODUCTION" as const,
      category: "EMAIL_DELIVERY" as const,
      purpose: "Email notifications, team invitations, password resets, and system alerts",
      baseUrl: "https://api.sendgrid.com/v3",
      version: "v3",
      status: process.env.SENDGRID_API_KEY ? "ACTIVE" as const : "INACTIVE" as const,
      dependentModules: ["notifications", "invitations", "password-reset", "alerts"],
      credentials: JSON.stringify({ apiKey: process.env.SENDGRID_API_KEY || "CONFIGURE_IN_ADMIN_PANEL" }),
      configSchema: JSON.stringify({
        type: "object",
        properties: {
          apiKey: { type: "string", description: "SendGrid API Key (starts with SG.)" }
        },
        required: ["apiKey"]
      })
    },
    {
      name: "UK Companies House API",
      serviceName: "companies-house",
      description: "Company verification and registration data for UK businesses",
      type: "EXTERNAL" as const,
      environment: "PRODUCTION" as const,
      category: "OTHER" as const,
      purpose: "Verify subcontractor company details, check registration status",
      baseUrl: "https://api.company-information.service.gov.uk",
      version: "v1",
      status: "INACTIVE" as const,
      dependentModules: ["subcontractors", "compliance"],
      credentials: JSON.stringify({ apiKey: "CONFIGURE_IN_ADMIN_PANEL" }),
      configSchema: JSON.stringify({
        type: "object",
        properties: {
          apiKey: { type: "string", description: "Companies House API Key" }
        },
        required: ["apiKey"]
      })
    },
    {
      name: "HSE Notifications API",
      serviceName: "hse-notifications",
      description: "Health & Safety Executive reporting for CDM 2015 compliance",
      type: "EXTERNAL" as const,
      environment: "PRODUCTION" as const,
      category: "OTHER" as const,
      purpose: "Submit F10 notifications, RIDDOR reports, and safety documentation",
      baseUrl: "https://notifications.hse.gov.uk/api",
      version: "v1",
      status: "INACTIVE" as const,
      dependentModules: ["safety", "permits", "compliance"],
      credentials: JSON.stringify({ apiKey: "CONFIGURE_IN_ADMIN_PANEL" }),
      configSchema: JSON.stringify({
        type: "object",
        properties: {
          apiKey: { type: "string", description: "HSE API Key" },
          organizationId: { type: "string", description: "HSE Organization ID" }
        },
        required: ["apiKey"]
      })
    }
  ];

  for (const connection of apiConnections) {
    const existing = await prisma.apiConnection.findFirst({
      where: { serviceName: connection.serviceName }
    });
    if (!existing) {
      await prisma.apiConnection.create({
        data: {
          ...connection,
          createdById: superadminUser.id,
          lastValidatedAt: new Date(),
          isBuiltIn: true,
          isEnabled: true
        }
      });
      console.log(`  Created API connection: ${connection.name}`);
    } else {
      console.log(`  API connection exists: ${connection.name}`);
    }
  }
  console.log("API connections seeded");

  console.log("\nDatabase seeding completed!");
  console.log("\n=== USER ACCOUNTS ===");
  console.log("  Accounts created as configured via environment variables.");
  console.log("  Passwords: [As configured via ADMIN_PASSWORD env var]");
  console.log("\n⚠️  SECURITY: Change all default passwords immediately after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });