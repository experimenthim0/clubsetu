import express from "express";
import ClubHead from "../models/ClubHead.js";
import Event from "../models/Event.js";
import { slugify } from "../utils/slugify.js";

const router = express.Router();

// GET /api/clubs — PUBLIC
router.get("/", async (req, res) => {
  try {
    const clubs = await ClubHead.find({ isVerified: true, isClubAdded: true }).select(
      "clubName description clubLogo clubGallery designation name facultyCoordinators studentCoordinators category clubInstagram clubLinkedin clubX clubWebsite clubWhatsapp clubUniqueId"
    );
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/clubs/:id — PUBLIC
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let query;
    
    // Check if ID is a valid MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { slug: id };
    }

    const club = await ClubHead.findOne(query).select(
      "-password -verificationToken -verificationTokenExpire"
    );
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const events = await Event.find({ createdBy: club._id }).sort({ startTime: 1 });

    res.json({ club, events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

import { verifyToken, requireRole } from "../middleware/auth.js";
import crypto from "crypto";

// PUT /api/clubs/:id — CLUB HEAD (OWNER) ONLY
router.put("/:id", verifyToken, requireRole("club-head"), async (req, res) => {
  try {
    const clubId = req.params.id;
    
    // Security: Only allow updating your own club
    if (req.user.id !== clubId) {
      return res.status(403).json({ message: "You can only update your own club's information." });
    }

    const updates = req.body;
    // Prevent updating sensitive authentication fields
    delete updates.collegeEmail;
    delete updates.password;
    delete updates.rollNo;
    delete updates.isVerified;

    // Generate slug if clubName is updated
    if (updates.clubName) {
      updates.slug = slugify(updates.clubName);
    }

    // Check if this is the first time adding club details
    const currentClub = await ClubHead.findById(clubId);
    if (currentClub && !currentClub.isClubAdded) {
      updates.isClubAdded = true;
      // Generate a unique club ID if not present
      if (!currentClub.clubUniqueId) {
        const randomId = crypto.randomBytes(3).toString('hex').toUpperCase();
        updates.clubUniqueId = `CLUB-${randomId}`;
      }
    }

    const club = await ClubHead.findByIdAndUpdate(clubId, updates, { new: true }).select("-password");
    if (!club) return res.status(404).json({ message: "Club not found" });

    res.json({ message: "Club information updated successfully", club });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
