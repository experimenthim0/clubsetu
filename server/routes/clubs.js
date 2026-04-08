import express from "express";
import Club from "../models/Club.js";
import ClubMember from "../models/ClubMember.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";
import crypto from "crypto";

const router = express.Router();

// GET /api/clubs — PUBLIC
router.get("/", async (req, res) => {
  try {
    const clubs = await Club.find();
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

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { slug: id };
    }

    const club = await Club.findOne(query);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // Find events for this club
    const events = await Event.find({ clubId: club._id }).sort({ startTime: 1 });

    res.json({ club, events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/clubs/:id — CLUB HEAD ONLY
router.put("/:id", verifyToken, allowRoles("admin", "clubHead"), async (req, res) => {
  try {
    const clubId = req.params.id;
    const { userId } = req.user;

    // Check if the user is a head of this club
    const membership = await ClubMember.findOne({ 
        userId, 
        clubId, 
        role: "head" 
    });

    if (!membership && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. You are not the head of this club." });
    }

    const updates = req.body;
    if (updates.clubName) {
      updates.slug = slugify(updates.clubName);
    }

    const club = await Club.findByIdAndUpdate(clubId, updates, { new: true });
    if (!club) return res.status(404).json({ message: "Club not found" });

    res.json({ message: "Club updated successfully", club });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
