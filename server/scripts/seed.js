import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { createObjectId } from "../utils/objectId.js";
import { slugify } from "../utils/slugify.js";

const clubsData = [
  ["Yoga and Meditation Club", "Dr. Neetu Sood", "soodn@nitj.ac.in", "ymclub@nitj.ac.in"],
  ["SWRAC (Social Works)", "Dr. Ashok Kumar Bagha", "baghaak@nitj.ac.in", "swraclub@nitj.ac.in"],
  ["LADC", "Dr. Shveta Mahajan", "mahajans@nitj.ac.in", "ladc@nitj.ac.in"],
  ["Zeal Society", "Dr. Shyamkiran Kaur", "kaursk@nitj.ac.in", "zealsocietiy@nitj.ac.in"],
  ["Food and Flavors Club", "Dr. Tarun Chaudhary", "chaudharyt@nitj.ac.in", "ffclub@nitj.ac.in"],
  ["Quest Club", "Dr. Gyan Praksh", "prakashg@nitj.ac.in", "questclub@nitj.ac.in"],
  ["Tedx NIT Jalandhar", "Dr. Samayveer Singh", "samays@nitj.ac.in", "tedxnitj@nitj.ac.in"],
  ["Photography and Movie Club", "Dr. Rajeev Verma", "vermar@nitj.ac.in", "photography@nitj.ac.in"],
  ["FinNest Finance Society", "Dr. Gaurav Kumar", "kumarg@nitj.ac.in", "financesociety@nitj.ac.in"],
  ["Media Cell (iota)", "Dr. Mohit Kumar", "kumarmohit@nitj.ac.in", "iota@nitj.ac.in"],
  ["Regional Activity Club", "Dr. K Senthil", "kasilingams@nitj.ac.in", "sanskriticlub@nitj.ac.in"],
  ["Aarogya", "Ravi Verma", "vermaravi@nitj.ac.in", "aarogyaclub@nitj.ac.in"],
];

async function seed() {
  try {
    console.log("Seeding Admin...");
    const adminPasswordHash = await bcrypt.hash("nikhil@him0148", 10);
    await prisma.adminRole.upsert({
      where: { email: "clubsetuadmin@nitj.ac.in" },
      update: { password: adminPasswordHash },
      create: {
        id: createObjectId(),
        name: "Admin",
        email: "clubsetuadmin@nitj.ac.in",
        password: adminPasswordHash,
        role: "admin",
        isTwoStepEnabled: false,
      },
    });

    console.log("Seeding Clubs...");
    for (const [clubName, facultyName, facultyEmail, clubEmail] of clubsData) {
      const slug = slugify(clubName);
      // Password logic: clubemail(before @) + "@him0148"
      const prefix = clubEmail.split("@")[0];
      const clubPassword = `${prefix}@him0148`;
      const clubPasswordHash = await bcrypt.hash(clubPassword, 10);

      await prisma.$transaction(async (tx) => {
        // 1. Create or Find Club record
        let club = await tx.club.findUnique({ where: { slug } });
        const clubId = club?.id || createObjectId();

        if (!club) {
          club = await tx.club.create({
            data: {
              id: clubId,
              clubName,
              slug,
              facultyName,
              facultyEmail,
              clubEmail,
            },
          });
        }

        // 2. Create AdminRole for Faculty Coordinator
        const facultyUser = await tx.adminRole.upsert({
          where: { email: facultyEmail },
          update: { password: clubPasswordHash },
          create: {
            id: createObjectId(),
            name: facultyName,
            email: facultyEmail,
            password: clubPasswordHash,
            role: "facultyCoordinator",
            isTwoStepEnabled: false,
          },
        });

        // 3. Create StudentUser for Club management (Head)
        let clubHeadUser;
        const existingStudent = await tx.studentUser.findUnique({ where: { email: clubEmail } });
        if (!existingStudent) {
          clubHeadUser = await tx.studentUser.create({
            data: {
              id: createObjectId(),
              name: clubName.toUpperCase(),
              email: clubEmail,
              password: clubPasswordHash,
              isVerified: true,
              isTwoStepEnabled: false,
            },
          });
        } else {
          clubHeadUser = await tx.studentUser.update({
            where: { email: clubEmail },
            data: { 
              password: clubPasswordHash,
              isVerified: true,
              isTwoStepEnabled: false
            }
          });
        }

        const finalStudentId = clubHeadUser.id;

        // 4. Create Membership
        await tx.clubMembership.upsert({
          where: { clubId_studentId: { clubId: club.id, studentId: finalStudentId } },
          update: { role: "CLUB_HEAD", canTakeAttendance: true, canEditEvents: true },
          create: {
            id: createObjectId(),
            studentId: finalStudentId,
            clubId: club.id,
            role: "CLUB_HEAD",
            canTakeAttendance: true,
            canEditEvents: true,
          },
        });

        // 5. Update Club with FKs
        await tx.club.update({
          where: { id: club.id },
          data: {
            facultyCoordinatorId: facultyUser.id,
          },
        });
      });
      console.log(`Seeded: ${clubName}`);
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
