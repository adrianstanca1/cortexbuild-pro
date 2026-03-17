import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://cortexbuild:cortexbuild123@localhost:5432/cortexbuild"
    }
  }
});

async function testConnection() {
  console.log("Testing database connection...");
  try {
    await prisma.$connect();
    console.log("✅ Connected to database!");

    // Try to query
    const orgCount = await prisma.organization.count();
    console.log(`Organizations in database: ${orgCount}`);

    await prisma.$disconnect();
    console.log("✅ Test complete!");
  } catch (error) {
    console.error("❌ Connection failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
