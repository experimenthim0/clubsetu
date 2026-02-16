import mongoose from "mongoose";

async function connectDB(url) {
  try {
    await mongoose.connect(url);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err);
  }
}

export default connectDB;
