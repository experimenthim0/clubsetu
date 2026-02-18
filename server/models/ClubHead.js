import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const clubHeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    clubName: { type: String, required: true },
    phone: { type: String, required: true },
    collegeEmail: { type: String, required: true, unique: true },
    rollNo: { type: String, required: true, unique: true },
    branch: { type: String, required: true },
    year: { type: String, required: true },
    program: { type: String, required: true, enum: ["BTECH", "MTECH"] },
    designation: { type: String, required: true },
    password: { type: String, required: true },
    githubProfile: { type: String },
    linkedinProfile: { type: String },
    xProfile: { type: String },
    instagramProfile: { type: String },
    whatsappNumber: { type: String },
    portfolioUrl: { type: String },
    // Bank Information for Payment Settlements
    bankName: { type: String },
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    upiId: { type: String },
    bankPhone: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpire: { type: Date },
  },
  { timestamps: true },
);

// Hash password before saving
clubHeadSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
clubHeadSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("ClubHead", clubHeadSchema);
