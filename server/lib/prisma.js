import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

// Address the pg library SECURITY WARNING for SSL modes
const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

if (!isLocal) {
  if (connectionString.includes('sslmode=require') && !connectionString.includes('uselibpqcompat=true')) {
    connectionString = connectionString.replace('sslmode=require', 'uselibpqcompat=true&sslmode=require');
  } else if (!connectionString.includes('sslmode=')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    connectionString += separator + 'uselibpqcompat=true&sslmode=require';
  }
}

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
