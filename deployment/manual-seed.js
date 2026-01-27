const {
    PrismaClient
} = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database via manual-seed.js...");

    // Create default organization
    const org = await prisma.organization.upsert({
        where: {
            slug: "default"
        },
        update: {},
        create: {
            name: "CortexBuild Demo",
            slug: "default"
        }
    });
    console.log("Organization created:", org.name);

    // =====================
    // USERS
    // =====================
    const superadminPassword = await bcrypt.hash("Cumparavinde1", 12);
    const superadminUser = await prisma.user.upsert({
        where: {
            email: "adrian.stanca1@gmail.com"
        },
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

    // Project Manager
    const pmPassword = await bcrypt.hash("manager123", 12);
    const pmUser = await prisma.user.upsert({
        where: {
            email: "sarah@cortexbuild.com"
        },
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

    // =====================
    // PROJECTS
    // =====================
    const project1 = await prisma.project.upsert({
        where: {
            id: "project-downtown-office"
        },
        update: {},
        create: {
            id: "project-downtown-office",
            name: "Downtown Office Complex",
            description: "A 20-story commercial office building.",
            status: "IN_PROGRESS",
            location: "123 Main Street, Downtown",
            budget: 15000000,
            organizationId: org.id,
            managerId: pmUser.id
        }
    });
    console.log("Project created:", project1.name);

    const project2 = await prisma.project.upsert({
        where: {
            id: "project-riverside-homes"
        },
        update: {},
        create: {
            id: "project-riverside-homes",
            name: "Riverside Residential Development",
            description: "Luxury residential community.",
            status: "PLANNING",
            organizationId: org.id,
            managerId: pmUser.id
        }
    });
    console.log("Project created:", project2.name);

    const project3 = await prisma.project.upsert({
        where: {
            id: "project-mall-renovation"
        },
        update: {},
        create: {
            id: "project-mall-renovation",
            name: "Central Mall Renovation",
            description: "Complete renovation.",
            status: "ON_HOLD",
            organizationId: org.id,
            managerId: pmUser.id
        }
    });
    console.log("Project created:", project3.name);

    console.log("\nDatabase seeding (Users & Projects) completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });