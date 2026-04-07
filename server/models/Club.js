import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    clubName: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    description: { type: String },
    clubLogo: { type: String },
    clubGallery: [{ type: String }],
    clubSponsors: [{ type: String }],
    category: { type: String },
    uniqueId: { type: String, unique: true }, // Internal club identifier

    // Social Links (Flattened for backward compatibility)
    clubInstagram: { type: String },
    clubLinkedin: { type: String },
    clubX: { type: String },
    clubWhatsapp: { type: String },
    clubWebsite: { type: String },

    // Reference to Faculty CC
    facultyCoordinators: [{ type: String }],
    studentCoordinators: [{ type: String }], // Optional, as ClubMember might handle this.
  },
  { timestamps: true },
);

export default mongoose.model("Club", clubSchema);
