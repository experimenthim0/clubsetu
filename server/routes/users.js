import express from "express";
import { verifyToken } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

// PUT /api/users/:role/:id — update profile for the authenticated user
// The :role segment is kept for URL compatibility; actual table is determined by JWT userType.

router.put("/:role/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId, userType, role } = req.user;

  if (userId !== id && role !== "admin") {
    return res.status(403).json({ message: "Access denied." });
  }

  const updates = { ...req.body };

  // Prevent updates to restricted fields (some are model-specific but safe to remove regardless)
  delete updates.email;
  delete updates.rollNo;
  delete updates.password;
  delete updates.role;
  delete updates.isApproved;

  try {
    let user;

    if (userType === "admin") {
      user = await prisma.adminRole.update({ where: { id }, data: updates });
    } else if (userType === "external") {
      // External users can only update name, phone, collegeName
      const allowed = {};
      if (updates.name) allowed.name = updates.name;
      if (updates.phone) allowed.phone = updates.phone;
      if (updates.collegeName) allowed.collegeName = updates.collegeName;
      user = await prisma.externalUser.update({ where: { id }, data: allowed });
    } else {
      user = await prisma.studentUser.update({ where: { id }, data: updates });
    }

    const safeUser = Object.fromEntries(
      Object.entries(user).filter(([key]) => !["password", "otp", "otpExpire"].includes(key)),
    );

    res.json({ message: "Profile updated successfully", user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
