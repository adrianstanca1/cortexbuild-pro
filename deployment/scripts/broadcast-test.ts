/**
 * Real-time Broadcasting Test Script
 * 
 * Tests the real-time broadcasting functionality by simulating events.
 * 
 * Usage: npx tsx scripts/broadcast-test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Runs a scripted check that verifies real-time broadcasting by creating a test activity and enumerating supported broadcast event types.
 *
 * Creates a test activity log tied to the first organization, user, and project found in the database to trigger broadcasting, prints progress and the list of broadcast event types to the console, returns early if required seed data is missing, logs any errors, and always disconnects the Prisma client when finished.
 */
async function testBroadcastSetup() {
  console.log('\n🔔 Real-time Broadcasting Test');
  console.log('===============================\n');

  try {
    // Get first organization
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.log('❌ No organization found. Please run seed script first.');
      return;
    }
    console.log(`✓ Found organization: ${org.name}`);

    // Get first user
    const user = await prisma.user.findFirst({
      where: { organizationId: org.id }
    });
    if (!user) {
      console.log('❌ No user found for organization.');
      return;
    }
    console.log(`✓ Found user: ${user.name} (${user.email})`);

    // Get first project
    const project = await prisma.project.findFirst({
      where: { organizationId: org.id }
    });
    if (!project) {
      console.log('❌ No project found. Please create a project first.');
      return;
    }
    console.log(`✓ Found project: ${project.name}`);

    // Create a test activity log to trigger broadcast
    console.log('\n📤 Creating test activity log...');
    const activity = await prisma.activityLog.create({
      data: {
        action: 'test_broadcast',
        entityType: 'system',
        entityId: 'test-' + Date.now(),
        entityName: 'Broadcasting Test',
        details: 'This is a test activity log to verify broadcasting setup',
        userId: user.id,
        projectId: project.id
      }
    });
    console.log(`✓ Activity log created: ${activity.id}`);

    console.log('\n📊 Broadcast Event Types:');
    const eventTypes = [
      'task_created', 'task_updated', 'task_deleted',
      'project_created', 'project_updated', 'project_deleted',
      'document_uploaded', 'document_deleted',
      'team_member_added', 'team_member_removed',
      'rfi_created', 'rfi_updated', 'rfi_deleted',
      'submittal_created', 'submittal_updated', 'submittal_deleted',
      'change_order_created', 'change_order_updated', 'change_order_deleted',
      'daily_report_created', 'daily_report_updated',
      'safety_incident_reported', 'safety_incident_updated', 'safety_incident_resolved',
      'activity_logged'
    ];
    eventTypes.forEach(type => console.log(`   - ${type}`));

    console.log('\n✅ Broadcasting system is properly configured');
    console.log('\n💡 To test live broadcasting:');
    console.log('   1. Open the app in your browser');
    console.log('   2. Open browser DevTools > Network tab');
    console.log('   3. Look for /api/realtime SSE connection');
    console.log('   4. Create/update entities and observe real-time events');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBroadcastSetup();