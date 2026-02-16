import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rollNo: { type: String, required: true, unique: true },
    branch: { type: String, required: true },
    year: { type: String, required: true },
    program: { type: String, required: true, enum: ["BTECH", "MTECH"] },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    githubProfile: { type: String },
    linkedinProfile: { type: String },
    xProfile: { type: String },
    portfolioUrl: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Student", studentSchema);
