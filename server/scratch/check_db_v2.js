import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    const eventCount = await prisma.event.count();
    const paidEventCount = await prisma.event.count({
      where: { entryFee: { gt: 0 } }
    });
    const publishedEventCount = await prisma.event.count({
      where: { reviewStatus: 'PUBLISHED' }
    });
    const registrations = await prisma.registration.count();
    
    console.log(JSON.stringify({
      eventCount,
      paidEventCount,
      publishedEventCount,
      registrations
    }, null, 2));
  } catch (err) {
    console.error('Database Error:', err.message);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
