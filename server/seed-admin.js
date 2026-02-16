const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const dotenv = require("dotenv");

dotenv.config();

const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/club-event";

const seedAdmin = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding");

    const email = "nikhil@admin.ac.in";
    const password = "nikhil@123";

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log("Admin already exists");
    } else {
      const newAdmin = new Admin({ email, password });
      await newAdmin.save();
      console.log("Admin account created successfully");
    }

    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding admin:", error);
  }
};

seedAdmin();
