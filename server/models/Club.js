import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    // Core Identity
    clubName: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    description: { type: String },
    category: { type: String },
    uniqueId: { type: String, unique: true },

    // Contact Emails
    clubEmail: { type: String, unique: true },
    facultyEmail: { type: String }, // Can be multiple if needed, but for now schema level is simpler for seeding
    facultyName: { type: String },

    // Social Links (Consolidated into an array)
    socialLinks: [
      {
        platform: { type: String, required: true }, // e.g., 'instagram', 'linkedin', 'x', 'whatsapp', 'website'
        url: { type: String, required: true },
      },
    ],

    // Media & Assets
    clubLogo: { type: String },
    clubGallery: [{ type: String }],
    clubSponsors: [{ type: String }],

    // Financial Info (Bank Details)
    bankName: { type: String },
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    upiId: { type: String },
    bankPhone: { type: String },

    // References
    facultyCoordinators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    studentCoordinators: [{ type: String }], // Keeping for legacy or later use
  },
  { timestamps: true },
);

export default mongoose.model("Club", clubSchema);
