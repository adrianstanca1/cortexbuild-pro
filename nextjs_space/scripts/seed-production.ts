import bcrypt from "bcryptjs";
import { getScriptPrismaClient, disconnectScriptPrisma } from "../lib/script-db";

const prisma = getScriptPrismaClient();

// Environment detection
const NODE_ENV = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_STAGING = process.env.ENVIRONMENT === 'staging';

// Configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "adrian.stanca1@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error("❌ ADMIN_PASSWORD environment variable is required.");
  console.error("   Usage: ADMIN_PASSWORD=YourSecurePassword npx tsx scripts/seed-production.ts");
  process.exit(1);
}

/**
 * Seed production-safe baseline data
 * Only creates essentials: admin user and default organization
 */
async function seedProduction() {
  console.log("🏭 Production seed: Creating baseline data only...\n");

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: process.env.ORG_NAME || "CortexBuild Pro",
      slug: "default",
      entitlements: {
        modules: {
          projects: true,
          tasks: true,
          documents: true,
          rfis: true,
          submittals: true,
          changeOrders: true,
          dailyReports: true,
          safety: true,
          reports: true,
          team: true
        },
        limits: {
          storageGB: 50,
          maxUsers: 100,
          maxProjects: 500
        }
      }
    }
  });
  console.log("✅ Organization created:", org.name);

  // Create superadmin user
  const superadminPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const superadminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: superadminPassword,
      role: "SUPER_ADMIN"
    },
    create: {
      email: ADMIN_EMAIL,
      password: superadminPassword,
      name: process.env.ADMIN_NAME || "Platform Administrator",
      role: "SUPER_ADMIN",
      organizationId: org.id
    }
  });
  console.log("✅ Superadmin user created:", superadminUser.email);

  // Create team member for superadmin
  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: superadminUser.id, organizationId: org.id } },
    update: {},
    create: {
      userId: superadminUser.id,
      organizationId: org.id,
      jobTitle: "Platform Administrator"
    }
  });

  console.log("\n✅ Production baseline data created successfully");
  console.log("\n📝 Login Credentials:");
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log("   Password: [As configured via ADMIN_PASSWORD env var]");
  console.log("\n⚠️  SECURITY: Change the default password immediately after first login!\n");
}

/**
 * Seed staging environment with realistic test data
 */
async function seedStaging() {
  console.log("🎭 Staging seed: Creating baseline + test data...\n");
  
  // First create production baseline
  await seedProduction();

  console.log("\n📦 Adding staging-specific test data...");

  const org = await prisma.organization.findUnique({ where: { slug: "default" } });
  if (!org) throw new Error("Organization not found");

  // Add additional test users for staging
  const passwordSecret = ADMIN_PASSWORD;
  
  const testAdmin = await prisma.user.upsert({
    where: { email: "test.admin@cortexbuild.local" },
    update: {},
    create: {
      email: "test.admin@cortexbuild.local",
      password: await bcrypt.hash(passwordSecret, 12),
      name: "Test Admin",
      role: "ADMIN",
      organizationId: org.id
    }
  });

  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: testAdmin.id, organizationId: org.id } },
    update: {},
    create: {
      userId: testAdmin.id,
      organizationId: org.id,
      jobTitle: "Test Administrator"
    }
  });

  const testPM = await prisma.user.upsert({
    where: { email: "test.pm@cortexbuild.local" },
    update: {},
    create: {
      email: "test.pm@cortexbuild.local",
      password: await bcrypt.hash(passwordSecret, 12),
      name: "Test Project Manager",
      role: "PROJECT_MANAGER",
      organizationId: org.id
    }
  });

  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: testPM.id, organizationId: org.id } },
    update: {},
    create: {
      userId: testPM.id,
      organizationId: org.id,
      jobTitle: "Project Manager"
    }
  });

  console.log("✅ Test users created");

  // Create a test project
  const testProject = await prisma.project.upsert({
    where: { id: "test-project-staging" },
    update: {},
    create: {
      id: "test-project-staging",
      name: "Test Project - Staging Environment",
      description: "Sample project for testing in staging environment",
      status: "IN_PROGRESS",
      location: "123 Test Street",
      clientName: "Test Client Inc",
      budget: 1000000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      managerId: testPM.id
    }
  });

  // Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Test Task 1",
        description: "Sample task for testing",
        status: "TODO",
        priority: "MEDIUM",
        projectId: testProject.id,
        creatorId: testPM.id
      },
      {
        title: "Test Task 2",
        description: "Sample task in progress",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: testProject.id,
        creatorId: testPM.id
      }
    ]
  });

  console.log("✅ Test project and tasks created");
  console.log("\n✅ Staging environment seeded successfully\n");
}

/**
 * Seed development environment with full demo data
 */
async function seedDevelopment() {
  console.log("🔧 Development seed: Creating full demo dataset...\n");
  console.log("⚠️  For development, use the full seed script instead:");
  console.log("   npm run prisma db seed");
  console.log("   or: npx tsx scripts/seed.ts\n");
}

/**
 * Main seed function - environment-aware
 */
async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  CortexBuild Pro - Database Seeding");
  console.log("═══════════════════════════════════════════════\n");
  
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Production Mode: ${IS_PRODUCTION}`);
  console.log(`Staging Mode: ${IS_STAGING}\n`);

  try {
    if (IS_PRODUCTION) {
      // Production: Only baseline data
      console.log("⚠️  PRODUCTION MODE: Only essential data will be created");
      console.log("⚠️  No demo/test data will be added\n");
      
      // Safety check: Require explicit confirmation for production
      const confirmSeed = process.env.CONFIRM_PROD_SEED;
      if (confirmSeed !== 'yes') {
        console.log("❌ Production seed requires CONFIRM_PROD_SEED=yes");
        console.log("   This safety check prevents accidental seeding in production.\n");
        console.log("To seed production, run:");
        console.log("   CONFIRM_PROD_SEED=yes npm run prisma:seed\n");
        process.exit(1);
      }
      
      await seedProduction();
    } else if (IS_STAGING) {
      // Staging: Baseline + minimal test data
      await seedStaging();
    } else {
      // Development: Full demo data
      await seedDevelopment();
    }

    console.log("\n═══════════════════════════════════════════════");
    console.log("  ✅ Database seeding completed successfully");
    console.log("═══════════════════════════════════════════════\n");
  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectScriptPrisma();
  });

// Export for use by other scripts
export { seedProduction, seedStaging, seedDevelopment };
