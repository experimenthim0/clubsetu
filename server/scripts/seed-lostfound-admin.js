import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { createObjectId } from "../utils/objectId.js";

async function seedLostFoundAdmin() {
  try {
    console.log("Seeding Lost & Found Admin...");
    const password = process.env.ADMIN_PASS || "nikhil@him0148";
    const adminPasswordHash = await bcrypt.hash(password, 10);

    const result = await prisma.adminRole.upsert({
      where: { email: "lostfoundadmin@nitj.ac.in" },
      update: { password: adminPasswordHash },
      create: {
        id: createObjectId(),
        name: "L&F Admin",
        email: "lostfoundadmin@nitj.ac.in",
        password: adminPasswordHash,
        role: "lostFoundAdmin",
        isTwoStepEnabled: false,
      },
    });

    console.log("Seeding completed successfully!");
    console.log("Seeded user:", {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
    });
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLostFoundAdmin();
