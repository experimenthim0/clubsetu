import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const eventCount = await prisma.event.count();
  const paidEventCount = await prisma.event.count({
    where: { entryFee: { gt: 0 } }
  });
  const publishedEventCount = await prisma.event.count({
    where: { reviewStatus: 'PUBLISHED' }
  });
  const registrations = await prisma.registration.count();
  
  console.log({
    eventCount,
    paidEventCount,
    publishedEventCount,
    registrations
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
