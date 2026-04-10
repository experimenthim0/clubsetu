import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "facultyCoordinator", "club", "member", "paymentAdmin"],
      required: true,
      default: "member",
    },
    // Reference to the club (for faculty and club roles)
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
    
    // 2FA Fields
    otp: { type: String },
    otpExpire: { type: Date },
    isTwoStepEnabled: { type: Boolean, default: false }, // Default disabled, users can opt-in
    
    // Common student fields
    rollNo: { type: String, unique: true, sparse: true },
    branch: { type: String },
    year: { type: String },
    program: { type: String, enum: ["BTECH", "MTECH"] },
    phone: { type: String },
    
    // ClubHead/Club specific
    designation: { type: String },
    isApproved: { type: Boolean, default: false }, // For clubHead approval
    
    // Social Profiles
    githubProfile: { type: String },
    linkedinProfile: { type: String },
    xProfile: { type: String },
    instagramProfile: { type: String },
    portfolioUrl: { type: String },
    whatsappNumber: { type: String },

    // Financial Info (primarily for clubHeads)
    bankName: { type: String },
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    upiId: { type: String },
    bankPhone: { type: String },

    // Verification & Reset
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpire: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    passwordChangeCount: { type: Number, default: 0 },
    lastPasswordChangeDate: { type: Date },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
