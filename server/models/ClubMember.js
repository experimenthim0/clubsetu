import mongoose from "mongoose";

const clubMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    role: {
      type: String,
      enum: ["head", "member", "coordinator"],
      required: true,
      default: "member",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Ensure a user can only have one role in a specific club
clubMemberSchema.index({ userId: 1, clubId: 1 }, { unique: true });

export default mongoose.model("ClubMember", clubMemberSchema);
