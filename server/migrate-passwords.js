import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/club-event";

const SALT_ROUNDS = 10;

const migratePasswords = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for password migration");

    const db = mongoose.connection.db;

    // Migrate Students
    const students = await db.collection("students").find({}).toArray();
    let studentCount = 0;
    for (const student of students) {
      // Skip if password is already hashed (bcrypt hashes start with $2b$)
      if (student.password && !student.password.startsWith("$2b$")) {
        const hashed = await bcrypt.hash(student.password, SALT_ROUNDS);
        await db
          .collection("students")
          .updateOne({ _id: student._id }, { $set: { password: hashed } });
        studentCount++;
      }
    }
    console.log(`Migrated ${studentCount} student passwords`);

    // Migrate ClubHeads
    const clubHeads = await db.collection("clubheads").find({}).toArray();
    let clubHeadCount = 0;
    for (const head of clubHeads) {
      if (head.password && !head.password.startsWith("$2b$")) {
        const hashed = await bcrypt.hash(head.password, SALT_ROUNDS);
        await db
          .collection("clubheads")
          .updateOne({ _id: head._id }, { $set: { password: hashed } });
        clubHeadCount++;
      }
    }
    console.log(`Migrated ${clubHeadCount} club head passwords`);

    // Migrate Admins
    const admins = await db.collection("admins").find({}).toArray();
    let adminCount = 0;
    for (const admin of admins) {
      if (admin.password && !admin.password.startsWith("$2b$")) {
        const hashed = await bcrypt.hash(admin.password, SALT_ROUNDS);
        await db
          .collection("admins")
          .updateOne({ _id: admin._id }, { $set: { password: hashed } });
        adminCount++;
      }
    }
    console.log(`Migrated ${adminCount} admin passwords`);

    console.log("Password migration complete!");
    mongoose.disconnect();
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
};

migratePasswords();
