import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const connections = await prisma.apiConnection.findMany()
  console.log("API Connections:", JSON.stringify(connections, null, 2))
}
main().then(() => prisma.$disconnect())
