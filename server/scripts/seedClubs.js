
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import User from "../models/User.js";
import Club from "../models/Club.js";
import { slugify } from "../utils/slugify.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const COMMON_PASSWORD = process.env.COMMON_PASSWORD;

const seed = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const clubsMdPath = path.join(__dirname, "../../clubs.md");
        const data = fs.readFileSync(clubsMdPath, "utf-8");
        const lines = data.split("\n").filter(line => line.trim() !== "");

        // Skip header
        const clubLines = lines.slice(1);

        for (const line of clubLines) {
            const [clubName, facultyName, facultyEmail, clubEmail] = line.split(",").map(s => s.trim());

            if (!clubName || !facultyEmail || !clubEmail) continue;

            console.log(`Processing club: ${clubName}`);

            const slug = slugify(clubName);

            // 1. Create/Update Club
            let club = await Club.findOne({ slug });
            if (!club) {
                const randomId = crypto.randomBytes(3).toString("hex").toUpperCase();
                club = new Club({ 
                    clubName, 
                    slug,
                    uniqueId: `CLUB-${randomId}` 
                });
            }
            club.facultyName = facultyName;
            club.facultyEmail = facultyEmail;
            club.clubEmail = clubEmail;
            await club.save();

            // 2. Create/Update Club User
            let clubUser = await User.findOne({ email: clubEmail });
            if (!clubUser) {
                clubUser = new User({
                    name: clubName.toUpperCase(),
                    email: clubEmail,
                    password: COMMON_PASSWORD,
                    role: "club",
                    clubId: club._id,
                    isVerified: true,
                    isTwoStepEnabled: true
                });
            } else {
                clubUser.role = "club";
                clubUser.clubId = club._id;
                clubUser.password = COMMON_PASSWORD;
            }
            await clubUser.save();

            // 3. Create/Update Faculty User
            let facultyUser = await User.findOne({ email: facultyEmail });
            if (!facultyUser) {
                facultyUser = new User({
                    name: facultyName,
                    email: facultyEmail,
                    password: COMMON_PASSWORD,
                    role: "facultyCoordinator",
                    clubId: club._id,
                    isVerified: true,
                    isTwoStepEnabled: true
                });
            } else {
                facultyUser.role = "facultyCoordinator";
                facultyUser.clubId = club._id;
                facultyUser.password = COMMON_PASSWORD;
            }
            await facultyUser.save();

            // 4. Link Faculty to Club if not already
            if (!club.facultyCoordinators.includes(facultyUser._id)) {
                club.facultyCoordinators.push(facultyUser._id);
            }
            await club.save();

            console.log(`  - Club and Users seeded for ${clubName}`);
        }

        // 5. Create/Update Admin User
        const adminEmail = process.env.ADMIN_EMAIL || "nikhil@admin.ac.in";
        console.log(`Processing Admin: ${adminEmail}`);
        let adminUser = await User.findOne({ email: adminEmail });
        if (!adminUser) {
            adminUser = new User({
                name: "ADMINISTRATOR",
                email: adminEmail,
                password: COMMON_PASSWORD,
                role: "admin",
                isVerified: true,
                isTwoStepEnabled: true
            });
        } else {
            adminUser.role = "admin";
            adminUser.password = COMMON_PASSWORD;
        }
        await adminUser.save();
        console.log("  - Admin user seeded successfully");

        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seed();
