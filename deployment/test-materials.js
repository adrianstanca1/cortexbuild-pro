const {
    PrismaClient
} = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Testing Materials API interactions via database...");

    // 1. Get a test project
    const project = await prisma.project.findFirst();
    if (!project) {
        console.error("No projects found. Seed database first.");
        process.exit(1);
    }
    console.log(`Using project: ${project.name} (${project.id})`);

    // 2. Create a material via Prisma (simulating API logic)
    const material = await prisma.material.create({
        data: {
            projectId: project.id,
            name: "Test Steel Beams (Production Verification)",
            description: "Auto-generated verification record",
            quantityNeeded: 50,
            quantityOrdered: 0,
            unitCost: 120.50,
            totalCost: 6025.00,
            status: "PLANNED",
            createdById: (await prisma.user.findFirst()).id // Use first available user
        }
    });
    console.log("Created material via Prisma:", material.name, "(", material.id, ")");

    // 3. Verify retrieval
    const retrieved = await prisma.material.findUnique({
        where: {
            id: material.id
        }
    });

    if (retrieved) {
        console.log("SUCCESS: Material verified in database.");
    } else {
        console.error("FAILURE: Material not found after creation.");
        process.exit(1);
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