import express from "express";
import Student from "../models/Student.js";
import ClubHead from "../models/ClubHead.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// PUT /api/users/:role/:id — AUTHENTICATED USERS ONLY
router.put("/:role/:id", verifyToken, async (req, res) => {
  const { role, id } = req.params;
  const updates = req.body;

  // Verify user is updating their own profile
  if (req.user.id !== id) {
    return res
      .status(403)
      .json({ message: "You can only update your own profile." });
  }

  // Prevent updates to restricted fields
  delete updates.email;
  delete updates.rollNo;
  delete updates.collegeEmail;
  delete updates.password;

  try {
    let user;
    if (role === "student") {
      user = await Student.findByIdAndUpdate(id, updates, { new: true });
    } else if (role === "club-head") {
      user = await ClubHead.findByIdAndUpdate(id, updates, { new: true });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
