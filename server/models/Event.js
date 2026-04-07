import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String },
    venue: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    totalSeats: { type: Number, default: 0 }, // 0 = Unlimited
    entryFee: { type: Number, default: 0 },
    allowedPrograms: {
      type: [String],
      default: ["BTECH", "MTECH"],
    },
    allowedYears: {
      type: [String],
      default: [], // empty = all years allowed
    },
    imageUrl: { type: String, default: "" }, // URL for event image
    registeredCount: { type: Number, default: 0 },
    waitingList: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Registration" },
    ],
    requiredFields: [{ type: String }], // Array of field names that are required for registration
    customFields: [
      {
        label: { type: String, required: true },
        type: {
          type: String,
          enum: ["text", "url", "textarea", "select"],
          default: "text",
        },
        required: { type: Boolean, default: false },
        options: [{ type: String }], // Only used for type "select"
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    }, // Reference to User (the one who created it)
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      index: true,
    }, // Reference to the Club
    payoutStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },
    registrationDeadline: { type: Date }, // Deadline for registrations
    // status can be computed, but we might store it for caching if needed.
    // For now, we'll compute it or use a virtual.
  
    winners: {
      type: Array,
      default: [],
    },
    showWinner: {
      type: Boolean,
      default: false,
    },
    provideCertificate: {
      type: Boolean,
      default: false,
    },
    certificateTemplate: {
      imageUrl: String,
      nameX: Number,
      nameY: Number,
      nameWidth: Number,
      nameHeight: Number,
      fontSize: Number,
      color: String,
      font: String,
      align: String,
      imageWidth: Number,
      imageHeight: Number,
    },
  },
  { timestamps: true },
);

// Virtual for status
eventSchema.virtual("status").get(function () {
  const now = new Date();
  if (now < this.startTime) return "UPCOMING";
  if (now >= this.startTime && now <= this.endTime) return "LIVE";
  return "ENDED";
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

export default mongoose.model("Event", eventSchema);
