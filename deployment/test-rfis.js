const {
    PrismaClient
} = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Testing RFI Module...");

    // 1. Get Project and User
    const project = await prisma.project.findFirst();
    const user = await prisma.user.findFirst();

    if (!project || !user) {
        console.error("Missing seed data (Project/User)");
        process.exit(1);
    }

    // 2. Create RFI
    // Logic replicates POST /api/rfis

    // Get next number
    const lastRFI = await prisma.rFI.findFirst({
        where: {
            projectId: project.id
        },
        orderBy: {
            number: 'desc'
        }
    });

    // FIXED SYNTAX: standard ternary or short-circuit
    const nextNumber = (lastRFI && lastRFI.number ? lastRFI.number : 0) + 1;

    console.log(`Creating RFI #${nextNumber} for project: ${project.name}`);

    const rfi = await prisma.rFI.create({
        data: {
            number: nextNumber,
            subject: "Verification RFI: Structural Steel Specs",
            question: "Please confirm steel grade for main columns.",
            projectId: project.id,
            createdById: user.id,
            status: 'OPEN',
            ballInCourt: 'Internal',
            costImpact: false,
            scheduleImpact: true
        }
    });

    console.log("RFI Created:", rfi.id);

    // 3. Verify Log
    const log = await prisma.activityLog.findFirst({
        where: {
            entityType: 'rfi',
            entityId: rfi.id
        }
    });

    if (log) {
        console.log("Activity Log verified:", log.action);
    } else {
        console.warn("WARNING: Activity log missing for RFI creation.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });