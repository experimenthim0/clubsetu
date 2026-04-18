import prisma from "../lib/prisma.js";

async function main() {
  // Check what columns exist in ClubMembership by querying information_schema
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'ClubMembership' 
    ORDER BY ordinal_position
  `;
  console.log("ClubMembership columns:", JSON.stringify(cols, null, 2));

  // Check all tables
  const tables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log("Tables:", tables.map(t => t.table_name));

  // Count rows in ClubMembership
  const count = await prisma.$queryRaw`SELECT COUNT(*) FROM "ClubMembership"`;
  console.log("ClubMembership row count:", count);

  // Sample rows
  const rows = await prisma.$queryRaw`SELECT * FROM "ClubMembership" LIMIT 5`;
  console.log("Sample ClubMembership rows:", JSON.stringify(rows, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
