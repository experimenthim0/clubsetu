
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ClubHead from './models/ClubHead.js';
import crypto from 'crypto';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const clubs = await ClubHead.find({});
    console.log(`Checking ${clubs.length} clubs...`);

    for (const club of clubs) {
      let needsUpdate = false;
      
      // If they have a description or name, they likely already "added" the club
      if (club.description && !club.isClubAdded) {
        club.isClubAdded = true;
        needsUpdate = true;
      }

      if (!club.clubUniqueId) {
        const randomId = crypto.randomBytes(3).toString('hex').toUpperCase();
        club.clubUniqueId = `CLUB-${randomId}`;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await club.save();
        console.log(`Updated club: ${club.clubName} (${club.clubUniqueId})`);
      }
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
