import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpire: { type: Date },
  },
  { timestamps: true },
);

// Hash password before saving
studentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Student", studentSchema);
