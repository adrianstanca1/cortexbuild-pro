import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Performs a sequence of platform integrity checks by counting records across key database models.
 *
 * Checks users, projects, site access logs, worker certifications, lifting operations, and webhooks,
 * logging each count. If no users are found or any count operation fails, the process is terminated with exit code 1.
 * The Prisma client is disconnected when verification completes or on failure.
 */
async function verifyPlatform() {
  console.log('🚀 Starting CortexBuild Pro Platform Verification...');
  
  try {
    // 1. Core Users
    const users = await prisma.user.count();
    console.log(`✅ Users: ${users}`);
    if (users === 0) throw new Error('No users found!');

    // 2. Projects
    const projects = await prisma.project.count();
    console.log(`✅ Projects: ${projects}`);

    // 3. Compliance - Site Access
    const logs = await prisma.siteAccessLog.count();
    console.log(`✅ Site Access Logs: ${logs}`);

    // 4. Compliance - Certs
    const certs = await prisma.workerCertification.count();
    console.log(`✅ Worker Certs: ${certs}`);

    // 5. Compliance - Lifting
    const lifts = await prisma.liftingOperation.count();
    console.log(`✅ Lifting Ops: ${lifts}`);

    // 6. Admin
    const webhooks = await prisma.webhook.count();
    console.log(`✅ Webhooks: ${webhooks}`);
    
    console.log('✨ Platform Verification: PASSED');
  } catch (error) {
    console.error('❌ Verification FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPlatform();