import "dotenv/config";
import prisma from "../lib/prisma.js";

async function main() {
  console.log("Fetching admin roles...");
  const admins = await prisma.adminRole.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
  console.log("Current admin roles in database:");
  console.log(JSON.stringify(admins, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
