import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ClubHead from './models/ClubHead.js';
import connectDB from './connection.js';

dotenv.config();

const migrateApprovals = async () => {
  try {
    console.log('Connecting to DB...');
    await connectDB(process.env.MONGO_URI);
    
    console.log('Starting migration for existing club heads...');
    
    // Update all existing club heads where isApproved is not true
    const result = await ClubHead.updateMany(
      { isApproved: { $ne: true } },
      { $set: { isApproved: true } }
    );

    console.log(`Migration complete. ${result.modifiedCount} club heads were approved.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateApprovals();
