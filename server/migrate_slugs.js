import "dotenv/config";
import mongoose from "mongoose";
import ClubHead from "./models/ClubHead.js";
import Event from "./models/Event.js";
import { slugify } from "./utils/slugify.js";

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for migration");

    // Migrate Clubs
    const clubs = await ClubHead.find({ slug: { $exists: false } });
    console.log(`Found ${clubs.length} clubs to migrate`);
    for (const club of clubs) {
      club.slug = slugify(club.clubName);
      await club.save();
      console.log(`Migrated club: ${club.clubName} -> ${club.slug}`);
    }

    // Migrate Events
    const events = await Event.find({ slug: { $exists: false } });
    console.log(`Found ${events.length} events to migrate`);
    for (const event of events) {
      event.slug = slugify(event.title);
      await event.save();
      console.log(`Migrated event: ${event.title} -> ${event.slug}`);
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migrate();
