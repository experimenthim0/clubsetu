import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkIds() {
  const clubId = "cc77c72dc2f4ba129f2d11a4";
  const membershipId = "b499cdcafd6166e0d4c901bc";

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  const membership = await prisma.clubMembership.findUnique({ where: { id: membershipId } });

  console.log("Club exists:", !!club);
  if (club) console.log("Club Name:", club.clubName);
  
  console.log("Membership exists:", !!membership);
  if (membership) console.log("Membership UserID:", membership.userId);

  await prisma.$disconnect();
}

checkIds();
