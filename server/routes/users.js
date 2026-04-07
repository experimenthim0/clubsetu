import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// PUT /api/users/:role/:id — AUTHENTICATED USERS ONLY
router.put("/:role/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Verify user is updating their own profile (Unified userId)
  if (req.user.userId !== id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied." });
  }

  // Prevent updates to restricted fields
  delete updates.email;
  delete updates.rollNo;
  delete updates.password;
  delete updates.role;
  delete updates.isApproved;

  try {
    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
